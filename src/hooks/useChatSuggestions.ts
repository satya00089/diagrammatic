import { useMemo } from 'react';
import type { UserIntent, CanvasContext, Suggestion } from '../types/chatBot';
import { COMPONENTS } from '../config/components';

export const useChatSuggestions = (
  userIntent: UserIntent | null,
  canvasContext: CanvasContext | null
): Suggestion[] => {
  return useMemo(() => {
    const suggestions: Suggestion[] = [];

    if (!userIntent && !canvasContext) {
      return suggestions;
    }

    // Pattern detection from user intent
    const intentText = userIntent
      ? `${userIntent.title} ${userIntent.description}`.toLowerCase()
      : '';

    // Database/ER patterns
    if (intentText.includes('database') || intentText.includes('schema') || intentText.includes('er ')) {
      suggestions.push({
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
      suggestions.push({
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
      suggestions.push({
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
      suggestions.push({
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
      suggestions.push({
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
      suggestions.push({
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
      suggestions.push({
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
      suggestions.push({
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
      suggestions.push({
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
        suggestions.push({
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
        suggestions.push({
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
        suggestions.push({
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
        suggestions.push({
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
        suggestions.push({
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
    if (suggestions.length === 0) {
      suggestions.push({
        id: 'tip-palette',
        title: 'Explore Components',
        description: `Browse ${COMPONENTS.length}+ components in the palette`,
        action: () => {},
        icon: '🎨',
        category: 'tip',
        priority: 5,
        actionType: 'info-only',
      });
      suggestions.push({
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
    return suggestions.sort((a, b) => b.priority - a.priority).slice(0, 5);
  }, [userIntent, canvasContext]);
};
