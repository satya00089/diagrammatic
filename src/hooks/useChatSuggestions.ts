import { useMemo, useState, useEffect } from 'react';
import type { Node, Edge } from '@xyflow/react';
import type { UserIntent, CanvasContext, Suggestion } from '../types/chatBot';
import { COMPONENTS } from '../config/components';
import { apiService } from '../services/api';

/**
 * Hook for getting AI-powered chat suggestions.
 * 
 * Strategy:
 * 1. Try AI-powered recommendations first (high precision)
 * 2. Fall back to rule-based suggestions if AI fails
 * 3. Cache results to avoid redundant API calls
 */
export const useChatSuggestions = (
  userIntent: UserIntent | null,
  canvasContext: CanvasContext | null,
  nodes: Node[] = [],
  edges: Edge[] = []
): Suggestion[] => {
  const [aiSuggestions, setAiSuggestions] = useState<Suggestion[] | null>(null);

  // Fetch AI suggestions when context changes
  useEffect(() => {
    if (!canvasContext) {
      setAiSuggestions(null);
      return;
    }

    const fetchAISuggestions = async () => {
      try {
        // Transform nodes to component info with rich details
        const components = nodes.map(node => {
          const nodeData = node.data || {};
          const hasDescription = Boolean(
            nodeData.description || 
            nodeData.subtitle || 
            (nodeData.properties && Object.keys(nodeData.properties).length > 0)
          );

          // Gather all properties
          const properties: Record<string, unknown> = {
            description: nodeData.description || nodeData.subtitle || '',
            componentId: nodeData.componentId,
            icon: nodeData.icon,
          };

          // Add nodeData.properties if it exists and is an object
          if (nodeData.properties && typeof nodeData.properties === 'object') {
            Object.assign(properties, nodeData.properties);
          }

          // Include custom properties if they exist
          if (nodeData._customProperties) {
            properties.customProperties = nodeData._customProperties;
          }

          return {
            id: node.id,
            type: node.type || 'custom',
            label: typeof nodeData.label === 'string' ? nodeData.label : node.id,
            hasDescription,
            properties,
          };
        });

        // Transform edges to connection info with source/target details
        const connections = edges.map(edge => {
          const edgeData = edge.data || {};
          
          return {
            source: edge.source,
            target: edge.target,
            type: (edge.type || edgeData.type) as string | undefined,
            hasLabel: Boolean(edgeData.label || edgeData.hasLabel),
          };
        });

        // Build request payload with RICH context
        const response = await apiService.getRecommendations({
          userIntent,
          canvasContext: canvasContext || {
            nodeCount: 0,
            edgeCount: 0,
            componentTypes: [],
            isEmpty: true,
          },
          components,
          connections,
          maxSuggestions: 5,
        });

        // Transform AI recommendations to Suggestion format
        const aiRecs: Suggestion[] = response.recommendations.map(rec => ({
          id: rec.id,
          title: rec.title,
          description: rec.description,
          icon: rec.icon,
          category: rec.category,
          priority: rec.priority,
          componentId: rec.componentId,
          componentIds: rec.componentIds,
          actionType: rec.actionType,
          confidence: rec.confidence,
          reasoning: rec.reasoning,
          action: () => {}, // Will be handled by parent component
        }));

        setAiSuggestions(aiRecs);
        
        // Log success for debugging
        if (aiRecs.length > 0) {
          console.log(`✅ AI Recommendations: ${aiRecs.length} suggestions (confidence >= ${response.minConfidenceThreshold})`);
        }
      } catch (error) {
        console.log('ℹ️ Falling back to rule-based suggestions:', error instanceof Error ? error.message : 'Unknown error');
        setAiSuggestions(null); // Fall back to rule-based
      }
    };

    // Debounce API calls to avoid too many requests
    const timeoutId = setTimeout(() => {
      fetchAISuggestions();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [userIntent, canvasContext, nodes, edges]);

  // Rule-based suggestions (fallback)
  const ruleBasedSuggestions = useMemo(() => {
    const fallbackSuggestions: Suggestion[] = [];

    if (!userIntent && !canvasContext) {
      return fallbackSuggestions;
    }

    // Pattern detection from user intent
    const intentText = userIntent
      ? `${userIntent.title} ${userIntent.description}`.toLowerCase()
      : '';

    // Database/ER patterns
    if (intentText.includes('database') || intentText.includes('schema') || intentText.includes('er ')) {
      fallbackSuggestions.push({
        id: 'er-entity',
        title: 'Add Entity',
        description: 'Create a database entity with attributes',
        action: () => {}, // Will be handled by parent
        icon: '📦',
        category: 'component',
        priority: 10,
        componentId: 'er-entity',
        actionType: 'add-component',
      });
      fallbackSuggestions.push({
        id: 'er-relationship',
        title: 'Add Relationship',
        description: 'Connect entities with relationships',
        action: () => {},
        icon: '🔗',
        category: 'component',
        priority: 9,
        componentId: 'er-relationship',
        actionType: 'add-component',
      });
    }

    // UML/Class diagram patterns
    if (
      intentText.includes('class') ||
      intentText.includes('uml') ||
      intentText.includes('oop') ||
      intentText.includes('object-oriented')
    ) {
      fallbackSuggestions.push({
        id: 'uml-class',
        title: 'Add Class',
        description: 'Create a UML class with methods and properties',
        action: () => {},
        icon: '🎓',
        category: 'component',
        priority: 10,
        componentId: 'uml-class',
        actionType: 'add-component',
      });
      fallbackSuggestions.push({
        id: 'uml-interface',
        title: 'Add Interface',
        description: 'Define an interface for your design',
        action: () => {},
        icon: '📋',
        category: 'component',
        priority: 8,
        componentId: 'uml-interface',
        actionType: 'add-component',
      });
    }

    // System Design patterns
    if (
      intentText.includes('system') ||
      intentText.includes('architecture') ||
      intentText.includes('microservice') ||
      intentText.includes('api')
    ) {
      fallbackSuggestions.push({
        id: 'api-gateway',
        title: 'Add API Gateway',
        description: 'Central entry point for your services',
        action: () => {},
        icon: '🚪',
        category: 'component',
        priority: 10,
        componentId: 'api-gateway',
        actionType: 'add-component',
      });
      fallbackSuggestions.push({
        id: 'load-balancer',
        title: 'Add Load Balancer',
        description: 'Distribute traffic across servers',
        action: () => {},
        icon: '⚖️',
        category: 'component',
        priority: 9,
        componentId: 'loadbalancer',
        actionType: 'add-component',
      });
      fallbackSuggestions.push({
        id: 'database',
        title: 'Add Database',
        description: 'Add a database to store your data',
        action: () => {},
        icon: '💾',
        category: 'component',
        priority: 8,
        componentId: 'database',
        actionType: 'add-component',
      });
    }

    // Cache patterns
    if (intentText.includes('cache') || intentText.includes('redis') || intentText.includes('performance')) {
      fallbackSuggestions.push({
        id: 'cache',
        title: 'Add Cache Layer',
        description: 'Improve performance with caching',
        action: () => {},
        icon: '⚡',
        category: 'component',
        priority: 9,
        componentId: 'cache',
        actionType: 'add-component',
      });
    }

    // Message Queue patterns
    if (
      intentText.includes('queue') ||
      intentText.includes('async') ||
      intentText.includes('message') ||
      intentText.includes('event')
    ) {
      fallbackSuggestions.push({
        id: 'message-queue',
        title: 'Add Message Queue',
        description: 'Enable asynchronous communication',
        action: () => {},
        icon: '📬',
        category: 'component',
        priority: 9,
        componentId: 'queue',
        actionType: 'add-component',
      });
    }

    // Context-based suggestions (canvas state)
    if (canvasContext) {
      const { nodeCount, componentTypes, isEmpty } = canvasContext;

      // Empty canvas suggestions
      if (isEmpty) {
        fallbackSuggestions.push({
          id: 'tip-start',
          title: 'Start with a Component',
          description: 'Drag a component from the palette to begin your design',
          action: () => {},
          icon: '💡',
          category: 'tip',
          priority: 10,
          actionType: 'info-only',
        });
      }

      // Has components but no connections
      if (nodeCount > 1 && componentTypes.length > 1) {
        fallbackSuggestions.push({
          id: 'tip-connect',
          title: 'Connect Components',
          description: 'Click and drag from one component to another to create connections',
          action: () => {},
          icon: '🔗',
          category: 'tip',
          priority: 8,
          actionType: 'info-only',
        });
      }

      // Many components suggest grouping
      if (nodeCount > 5) {
        fallbackSuggestions.push({
          id: 'group',
          title: 'Organize with Groups',
          description: 'Use group containers to organize related components',
          action: () => {},
          icon: '📁',
          category: 'pattern',
          priority: 7,
          componentId: 'cluster',
          actionType: 'add-component',
        });
      }

      // Has databases, suggest cache
      if (componentTypes.includes('database') && !componentTypes.includes('cache')) {
        fallbackSuggestions.push({
          id: 'pattern-cache',
          title: 'Consider Adding Cache',
          description: 'Reduce database load with a caching layer',
          action: () => {},
          icon: '⚡',
          category: 'pattern',
          priority: 8,
          componentId: 'cache',
          actionType: 'add-component',
        });
      }

      // Has API but no load balancer
      if (
        (componentTypes.includes('api-gateway') || componentTypes.includes('server')) &&
        !componentTypes.includes('load-balancer')
      ) {
        fallbackSuggestions.push({
          id: 'pattern-lb',
          title: 'Add Load Balancing',
          description: 'Scale your API with a load balancer',
          action: () => {},
          icon: '⚖️',
          category: 'pattern',
          priority: 7,
          componentId: 'loadbalancer',
          actionType: 'add-component',
        });
      }
    }

    // General tips if no specific patterns matched
    if (fallbackSuggestions.length === 0) {
      fallbackSuggestions.push({
        id: 'tip-palette',
        title: 'Explore Components',
        description: `Browse ${COMPONENTS.length}+ components in the palette`,
        action: () => {},
        icon: '🎨',
        category: 'tip',
        priority: 5,
        actionType: 'info-only',
      });
      fallbackSuggestions.push({
        id: 'tip-export',
        title: 'Export Your Design',
        description: 'Save your work as PNG or JSON',
        action: () => {},
        icon: '💾',
        category: 'tip',
        priority: 4,
        actionType: 'info-only',
      });
    }

    // Sort by priority
    return fallbackSuggestions.sort((a, b) => b.priority - a.priority).slice(0, 5);
  }, [userIntent, canvasContext]);

  // Return AI suggestions if available, otherwise fallback to rule-based
  // Prefer AI suggestions for higher precision and contextual relevance
  if (aiSuggestions && aiSuggestions.length > 0) {
    return aiSuggestions;
  }

  // Fallback to rule-based suggestions
  // This also handles the case when AI is loading or errored
  return ruleBasedSuggestions;
};
