/**
 * Yjs Collaboration Hook
 * Manages real-time collaborative editing using Yjs CRDT
 * 
 * Responsibilities (Single Responsibility Principle):
 * - Initialize Yjs document and provider
 * - Sync React Flow state with Yjs shared types
 * - Manage collaboration lifecycle
 * - Handle connection status
 * 
 * Dependencies (Dependency Inversion Principle):
 * - Abstracts WebSocket provider details
 * - Works with any Yjs-compatible provider
 */

import { useEffect, useState, useCallback, useRef } from 'react'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import type { Node, Edge } from '@xyflow/react'
import { getYjsUrl } from '../config/environment'

export interface CollaboratorUser {
  id: string
  name: string
  email?: string
  pictureUrl?: string
}

export interface CollaboratorCursor {
  userId: string
  user: CollaboratorUser
  position: { x: number; y: number }
  timestamp: string
}

export interface CollaborationState {
  isConnected: boolean
  isSynced: boolean
  error: string | null
  collaboratorCount: number
}

export interface UseYjsCollaborationParams {
  diagramId: string
  nodes: Node[]
  edges: Edge[]
  onNodesChange: (nodes: Node[]) => void
  onEdgesChange: (edges: Edge[]) => void
  userId: string
  userName: string
  userEmail?: string
  userPictureUrl?: string
  onUserJoined?: (user: CollaboratorUser) => void
  onUserLeft?: (user: CollaboratorUser) => void
}

export interface UseYjsCollaborationReturn {
  state: CollaborationState
  provider: WebsocketProvider | null
  collaborators: CollaboratorUser[]
  cursors: CollaboratorCursor[]
  sendCursorPosition: (position: { x: number; y: number }) => void
  disconnect: () => void
  reconnect: () => void
}

/**
 * Hook for managing Yjs collaboration
 * Implements graceful degradation - falls back to local state if connection fails
 */
export const useYjsCollaboration = ({
  diagramId,
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  userId,
  userName,
  userEmail,
  userPictureUrl,
  onUserJoined,
  onUserLeft,
}: UseYjsCollaborationParams): UseYjsCollaborationReturn => {
  // Yjs document (CRDT state container)
  const ydocRef = useRef<Y.Doc | null>(null)
  const providerRef = useRef<WebsocketProvider | null>(null)
  
  // Collaboration state
  const [state, setState] = useState<CollaborationState>({
    isConnected: false,
    isSynced: false,
    error: null,
    collaboratorCount: 0,
  })

  // Collaborators and cursors state
  const [collaborators, setCollaborators] = useState<CollaboratorUser[]>([])
  const [cursors, setCursors] = useState<CollaboratorCursor[]>([])
  const collaboratorsRef = useRef<CollaboratorUser[]>([])

  // Flag to prevent sync loops
  const isLocalChangeRef = useRef(false)

  /**
   * Initialize Yjs document and provider
   */
  const initialize = useCallback(() => {
    try {
      // Create Yjs document
      const ydoc = new Y.Doc()
      ydocRef.current = ydoc

      // Get shared types
      const yNodes = ydoc.getArray<Node>('nodes')
      const yEdges = ydoc.getArray<Edge>('edges')

      // Create WebSocket provider
      const provider = new WebsocketProvider(
        getYjsUrl(),
        `diagram-${diagramId}`,
        ydoc,
        {
          connect: true,
        }
      )
      providerRef.current = provider

      // Set local user awareness state (for presence and cursors)
      provider.awareness.setLocalState({
        user: {
          id: userId,
          name: userName,
          email: userEmail,
          pictureUrl: userPictureUrl,
        },
        cursor: null,
      })

      // Connection status handlers
      provider.on('status', ({ status }: { status: string }) => {
        setState((prev) => ({
          ...prev,
          isConnected: status === 'connected',
          error: status === 'disconnected' ? 'Disconnected from server' : null,
        }))
      })

      provider.on('sync', (isSynced: boolean) => {
        setState((prev) => ({
          ...prev,
          isSynced,
        }))

        // Initial sync: push local state to Yjs
        if (isSynced && yNodes.length === 0 && yEdges.length === 0) {
          isLocalChangeRef.current = true
          ydoc.transact(() => {
            yNodes.push(nodes)
            yEdges.push(edges)
          })
          isLocalChangeRef.current = false
        }
      })

      // Update collaborators, cursors, and count from awareness
      provider.awareness.on('change', (changes: {
        added: number[]
        updated: number[]
        removed: number[]
      }) => {
        const states = provider.awareness.getStates()
        const localClientId = provider.awareness.clientID

        // Track collaborators
        const collaboratorsList: CollaboratorUser[] = []
        const cursorsList: CollaboratorCursor[] = []

        states.forEach((state: { user?: CollaboratorUser; cursor?: { x: number; y: number } }, clientId: number) => {
          // Skip self
          if (clientId === localClientId) return

          const user = state.user as CollaboratorUser
          if (user) {
            collaboratorsList.push(user)

            // Track cursor if present
            if (state.cursor) {
              cursorsList.push({
                userId: user.id,
                user,
                position: state.cursor,
                timestamp: new Date().toISOString(),
              })
            }
          }
        })

        setCollaborators(collaboratorsList)
        setCursors(cursorsList)
        collaboratorsRef.current = collaboratorsList
        setState((prev) => ({
          ...prev,
          collaboratorCount: collaboratorsList.length,
        }))

        // Handle user joined events
        changes.added.forEach((clientId) => {
          if (clientId === localClientId) return
          const state = states.get(clientId) as { user?: CollaboratorUser; cursor?: { x: number; y: number } } | undefined
          if (state?.user) {
            onUserJoined?.(state.user)
          }
        })

        // Handle user left events
        changes.removed.forEach((clientId) => {
          if (clientId === localClientId) return
          // Find which user left by comparing with previous collaborators
          const leftUser = collaboratorsRef.current.find((c) => {
            return !collaboratorsList.some((nc) => nc.id === c.id)
          })
          if (leftUser) {
            onUserLeft?.(leftUser)
          }
        })
      })

      // Observe Yjs changes and update React Flow state
      const nodesObserver = () => {
        if (isLocalChangeRef.current) return
        
        const updatedNodes = yNodes.toArray()
        onNodesChange(updatedNodes)
      }

      const edgesObserver = () => {
        if (isLocalChangeRef.current) return
        
        const updatedEdges = yEdges.toArray()
        onEdgesChange(updatedEdges)
      }

      yNodes.observe(nodesObserver)
      yEdges.observe(edgesObserver)

      // Cleanup observers on unmount
      return () => {
        yNodes.unobserve(nodesObserver)
        yEdges.unobserve(edgesObserver)
        provider.destroy()
        ydoc.destroy()
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to initialize collaboration',
      }))
      console.error('Yjs initialization error:', error)
      return undefined
    }
  }, [diagramId, userId, userName, userEmail, userPictureUrl, nodes, edges, onNodesChange, onEdgesChange, onUserJoined, onUserLeft])

  /**
   * Sync local changes to Yjs
   */
  useEffect(() => {
    const ydoc = ydocRef.current
    if (!ydoc || !state.isSynced) return

    const yNodes = ydoc.getArray<Node>('nodes')
    const yEdges = ydoc.getArray<Edge>('edges')

    // Update Yjs when local state changes
    isLocalChangeRef.current = true
    ydoc.transact(() => {
      // Clear and repopulate (simple strategy)
      // For production, consider delta updates for better performance
      yNodes.delete(0, yNodes.length)
      yNodes.push(nodes)

      yEdges.delete(0, yEdges.length)
      yEdges.push(edges)
    })
    isLocalChangeRef.current = false
  }, [nodes, edges, state.isSynced])

  /**
   * Initialize on mount
   */
  useEffect(() => {
    const cleanup = initialize()
    return cleanup
  }, [initialize])

  /**
   * Disconnect from collaboration
   */
  const disconnect = useCallback(() => {
    if (providerRef.current) {
      providerRef.current.disconnect()
      setState((prev) => ({
        ...prev,
        isConnected: false,
        isSynced: false,
      }))
    }
  }, [])

  /**
   * Reconnect to collaboration
   */
  const reconnect = useCallback(() => {
    if (providerRef.current) {
      providerRef.current.connect()
    } else {
      initialize()
    }
  }, [initialize])

  /**
   * Send cursor position to other collaborators
   */
  const sendCursorPosition = useCallback((position: { x: number; y: number }) => {
    const provider = providerRef.current
    if (!provider || !state.isConnected) return

    // Update awareness with cursor position
    const currentState = provider.awareness.getLocalState()
    provider.awareness.setLocalState({
      ...currentState,
      cursor: position,
    })
  }, [state.isConnected])

  return {
    state,
    provider: providerRef.current,
    collaborators,
    cursors,
    sendCursorPosition,
    disconnect,
    reconnect,
  }
}
