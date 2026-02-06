/**
 * Graph builder: transforms GitHub tree data into graph nodes + links
 */

import type { GitHubTreeItem, GraphData, GraphNode, GraphLink, ModuleAnalysis } from "@/lib/types";
import { detectModuleType, getExtensionColor, MODULE_COLORS } from "./utils";

/**
 * Build a 3D graph from a GitHub file tree
 */
export function buildGraph(treeItems: GitHubTreeItem[]): GraphData {
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];
  const folderSet = new Set<string>();

  // Collect all unique folder paths
  for (const item of treeItems) {
    const parts = item.path.split("/");
    for (let i = 1; i < parts.length; i++) {
      folderSet.add(parts.slice(0, i).join("/"));
    }
  }

  // Add root node
  nodes.push({
    id: ".",
    name: "root",
    path: ".",
    type: "folder",
    moduleType: "unknown",
    depth: 0,
    color: "#ffffff",
  });

  // Add folder nodes
  for (const folderPath of folderSet) {
    const parts = folderPath.split("/");
    const name = parts[parts.length - 1];
    const moduleType = detectModuleType(folderPath);

    nodes.push({
      id: folderPath,
      name,
      path: folderPath,
      type: "folder",
      moduleType,
      depth: parts.length,
      color: MODULE_COLORS[moduleType] ?? "#9ca3af",
    });

    // Link to parent folder
    const parentPath = parts.length > 1 ? parts.slice(0, -1).join("/") : ".";
    links.push({
      source: parentPath,
      target: folderPath,
      type: "hierarchy",
    });
  }

  // Add file nodes
  for (const item of treeItems) {
    if (item.type !== "blob") continue;

    const parts = item.path.split("/");
    const name = parts[parts.length - 1];
    const ext = name.split(".").pop() ?? "";
    const moduleType = detectModuleType(item.path);

    nodes.push({
      id: item.path,
      name,
      path: item.path,
      type: "file",
      moduleType,
      size: item.size,
      extension: ext,
      depth: parts.length,
      color: getExtensionColor(name),
    });

    // Link to parent folder
    const parentPath = parts.length > 1 ? parts.slice(0, -1).join("/") : ".";
    links.push({
      source: parentPath,
      target: item.path,
      type: "hierarchy",
    });
  }

  return { nodes, links };
}

/**
 * Add dependency links to existing graph
 */
export function addDependencyLinks(
  graph: GraphData,
  dependencies: Array<{ source: string; target: string }>
): GraphData {
  const nodeIds = new Set(graph.nodes.map((n) => n.id));
  const existingLinks = new Set(graph.links.map((l) => `${l.source}->${l.target}`));

  const newLinks: GraphLink[] = [];
  for (const dep of dependencies) {
    const key = `${dep.source}->${dep.target}`;
    if (nodeIds.has(dep.source) && nodeIds.has(dep.target) && !existingLinks.has(key)) {
      newLinks.push({
        source: dep.source,
        target: dep.target,
        type: "dependency",
      });
      existingLinks.add(key);
    }
  }

  return {
    nodes: graph.nodes,
    links: [...graph.links, ...newLinks],
  };
}

/**
 * Group files into modules based on their detected type
 */
export function groupIntoModules(nodes: GraphNode[]): ModuleAnalysis[] {
  const groups: Record<string, string[]> = {};

  for (const node of nodes) {
    if (node.type !== "file") continue;
    const key = node.moduleType;
    if (!groups[key]) groups[key] = [];
    groups[key].push(node.path);
  }

  const moduleNames: Record<string, string> = {
    api: "API Layer",
    frontend: "Frontend / UI",
    database: "Database Layer",
    config: "Configuration",
    test: "Tests",
    docs: "Documentation",
    lib: "Shared Libraries",
    unknown: "Other Files",
  };

  return Object.entries(groups).map(([type, files]) => ({
    name: moduleNames[type] ?? type,
    type: type as GraphNode["moduleType"],
    description: `${files.length} files detected as ${type}`,
    files,
    entryPoints: [],
  }));
}
