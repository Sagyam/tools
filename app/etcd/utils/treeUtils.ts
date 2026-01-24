import { hierarchy, tree } from 'd3-hierarchy';
import { TreeNode, KeyValue } from '../types';

/**
 * Build a tree structure from a flat map of key-value pairs
 * Keys use path notation like "/config/app/name"
 */
export function buildTreeFromKeys(keyValues: Map<string, KeyValue>): TreeNode {
  const root: TreeNode = {
    name: 'root',
    fullPath: '/',
    children: [],
    isLeaf: false,
  };

  // Convert Map to array and sort keys
  const sortedEntries = Array.from(keyValues.entries()).sort((a, b) =>
    a[0].localeCompare(b[0])
  );

  for (const [key, kv] of sortedEntries) {
    // Split the key into path segments
    const segments = key.split('/').filter(Boolean);
    let currentNode = root;

    // Traverse/create the tree structure
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      const isLastSegment = i === segments.length - 1;
      const fullPath = '/' + segments.slice(0, i + 1).join('/');

      // Find or create child node
      if (!currentNode.children) {
        currentNode.children = [];
      }

      let childNode = currentNode.children.find(
        (child) => child.name === segment
      );

      if (!childNode) {
        childNode = {
          name: segment,
          fullPath,
          isLeaf: isLastSegment,
          children: isLastSegment ? undefined : [],
        };
        currentNode.children.push(childNode);
      }

      // If this is the last segment, add the value
      if (isLastSegment) {
        childNode.value = kv.value;
        childNode.isLeaf = true;
      }

      currentNode = childNode;
    }
  }

  return root;
}

/**
 * Calculate tree layout positions using d3-hierarchy
 * Returns nodes with x, y positions for rendering
 */
export function calculateTreeLayout(treeData: TreeNode, width: number, height: number) {
  // Create hierarchy
  const root = hierarchy(treeData);

  // Create tree layout
  const treeLayout = tree<TreeNode>()
    .size([width, height])
    .separation((a, b) => (a.parent === b.parent ? 1 : 2));

  // Compute the layout
  treeLayout(root);

  return root;
}

/**
 * Get all paths from a tree node (for autocomplete/suggestions)
 */
export function getAllPaths(node: TreeNode, paths: string[] = []): string[] {
  if (node.isLeaf) {
    paths.push(node.fullPath);
  }

  if (node.children) {
    for (const child of node.children) {
      getAllPaths(child, paths);
    }
  }

  return paths;
}
