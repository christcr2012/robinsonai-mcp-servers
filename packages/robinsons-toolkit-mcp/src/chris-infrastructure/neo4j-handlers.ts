/**
 * Neo4j Handlers for Chris's Infrastructure
 * 
 * Handler functions for all 20 Neo4j tools
 */

import { fastAPIClient } from './fastapi-client.js';

// ============================================================================
// Query Execution
// ============================================================================

export async function handleNeo4jQueryExecute(args: any) {
  const { cypher, params } = args;
  return await fastAPIClient.neo4jQuery(cypher, params);
}

// ============================================================================
// Knowledge Graph Operations
// ============================================================================

export async function handleNeo4jKnowledgeGraphCreateNode(args: any) {
  const { label, properties } = args;
  
  // Build property string
  const propEntries = Object.entries(properties).map(([key, value]) => {
    return `${key}: $${key}`;
  });
  const propString = propEntries.join(', ');
  
  const cypher = `
    CREATE (n:${label} {${propString}})
    RETURN n
  `;
  
  return await fastAPIClient.neo4jQuery(cypher, properties);
}

export async function handleNeo4jKnowledgeGraphCreateRelationship(args: any) {
  const { from_node, to_node, relationship_type, properties = {} } = args;
  
  // Build match patterns
  const fromLabel = from_node.label;
  const toLabel = to_node.label;
  const fromProps = Object.entries(from_node)
    .filter(([key]) => key !== 'label')
    .map(([key, value]) => `${key}: $from_${key}`)
    .join(', ');
  const toProps = Object.entries(to_node)
    .filter(([key]) => key !== 'label')
    .map(([key, value]) => `${key}: $to_${key}`)
    .join(', ');
  
  // Build relationship properties
  const relProps = Object.entries(properties)
    .map(([key, value]) => `${key}: $rel_${key}`)
    .join(', ');
  const relPropsString = relProps ? `{${relProps}}` : '';
  
  const cypher = `
    MATCH (a:${fromLabel} {${fromProps}})
    MATCH (b:${toLabel} {${toProps}})
    CREATE (a)-[r:${relationship_type} ${relPropsString}]->(b)
    RETURN a, r, b
  `;
  
  // Build parameters
  const params: any = {};
  Object.entries(from_node).forEach(([key, value]) => {
    if (key !== 'label') params[`from_${key}`] = value;
  });
  Object.entries(to_node).forEach(([key, value]) => {
    if (key !== 'label') params[`to_${key}`] = value;
  });
  Object.entries(properties).forEach(([key, value]) => {
    params[`rel_${key}`] = value;
  });
  
  return await fastAPIClient.neo4jQuery(cypher, params);
}

export async function handleNeo4jKnowledgeGraphQuery(args: any) {
  const { pattern, where, limit = 10 } = args;
  
  let cypher = `MATCH ${pattern}`;
  if (where) {
    cypher += ` WHERE ${where}`;
  }
  cypher += ` RETURN * LIMIT ${limit}`;
  
  return await fastAPIClient.neo4jQuery(cypher);
}

// ============================================================================
// Node Operations
// ============================================================================

export async function handleNeo4jNodeCreate(args: any) {
  const { label, properties } = args;
  
  const propEntries = Object.entries(properties).map(([key]) => `${key}: $${key}`);
  const propString = propEntries.join(', ');
  
  const cypher = `CREATE (n:${label} {${propString}}) RETURN n`;
  return await fastAPIClient.neo4jQuery(cypher, properties);
}

export async function handleNeo4jNodeGet(args: any) {
  const { node_id } = args;
  const cypher = `MATCH (n) WHERE id(n) = $node_id RETURN n`;
  return await fastAPIClient.neo4jQuery(cypher, { node_id: parseInt(node_id) });
}

export async function handleNeo4jNodeUpdate(args: any) {
  const { node_id, properties } = args;
  
  const propEntries = Object.entries(properties).map(([key]) => `n.${key} = $${key}`);
  const propString = propEntries.join(', ');
  
  const cypher = `
    MATCH (n) WHERE id(n) = $node_id
    SET ${propString}
    RETURN n
  `;
  
  return await fastAPIClient.neo4jQuery(cypher, { node_id: parseInt(node_id), ...properties });
}

export async function handleNeo4jNodeDelete(args: any) {
  const { node_id, detach = true } = args;
  const detachKeyword = detach ? 'DETACH ' : '';
  const cypher = `MATCH (n) WHERE id(n) = $node_id ${detachKeyword}DELETE n`;
  return await fastAPIClient.neo4jQuery(cypher, { node_id: parseInt(node_id) });
}

export async function handleNeo4jNodeSearch(args: any) {
  const { label, properties, limit = 10 } = args;
  
  let cypher = 'MATCH (n';
  if (label) {
    cypher += `:${label}`;
  }
  
  if (properties && Object.keys(properties).length > 0) {
    const propEntries = Object.entries(properties).map(([key]) => `${key}: $${key}`);
    cypher += ` {${propEntries.join(', ')}}`;
  }
  
  cypher += `) RETURN n LIMIT ${limit}`;
  
  return await fastAPIClient.neo4jQuery(cypher, properties || {});
}

// ============================================================================
// Relationship Operations
// ============================================================================

export async function handleNeo4jRelationshipCreate(args: any) {
  const { from_node_id, to_node_id, type, properties = {} } = args;
  
  const propEntries = Object.entries(properties).map(([key]) => `${key}: $${key}`);
  const propString = propEntries.length > 0 ? `{${propEntries.join(', ')}}` : '';
  
  const cypher = `
    MATCH (a) WHERE id(a) = $from_node_id
    MATCH (b) WHERE id(b) = $to_node_id
    CREATE (a)-[r:${type} ${propString}]->(b)
    RETURN r
  `;
  
  return await fastAPIClient.neo4jQuery(cypher, {
    from_node_id: parseInt(from_node_id),
    to_node_id: parseInt(to_node_id),
    ...properties,
  });
}

export async function handleNeo4jRelationshipGet(args: any) {
  const { relationship_id } = args;
  const cypher = `MATCH ()-[r]->() WHERE id(r) = $relationship_id RETURN r`;
  return await fastAPIClient.neo4jQuery(cypher, { relationship_id: parseInt(relationship_id) });
}

export async function handleNeo4jRelationshipDelete(args: any) {
  const { relationship_id } = args;
  const cypher = `MATCH ()-[r]->() WHERE id(r) = $relationship_id DELETE r`;
  return await fastAPIClient.neo4jQuery(cypher, { relationship_id: parseInt(relationship_id) });
}

export async function handleNeo4jRelationshipSearch(args: any) {
  const { type, limit = 10 } = args;
  
  let cypher = 'MATCH ()-[r';
  if (type) {
    cypher += `:${type}`;
  }
  cypher += `]->() RETURN r LIMIT ${limit}`;
  
  return await fastAPIClient.neo4jQuery(cypher);
}

// ============================================================================
// Pattern Matching
// ============================================================================

export async function handleNeo4jPatternMatch(args: any) {
  const { pattern, where, return_clause = '*', limit = 10 } = args;
  
  let cypher = `MATCH ${pattern}`;
  if (where) {
    cypher += ` WHERE ${where}`;
  }
  cypher += ` RETURN ${return_clause} LIMIT ${limit}`;
  
  return await fastAPIClient.neo4jQuery(cypher);
}

export async function handleNeo4jPathFind(args: any) {
  const { from_node, to_node, max_depth = 5, relationship_types } = args;
  
  // Build node match patterns
  const fromLabel = from_node.label;
  const toLabel = to_node.label;
  const fromProps = Object.entries(from_node)
    .filter(([key]) => key !== 'label')
    .map(([key]) => `${key}: $from_${key}`)
    .join(', ');
  const toProps = Object.entries(to_node)
    .filter(([key]) => key !== 'label')
    .map(([key]) => `${key}: $to_${key}`)
    .join(', ');
  
  // Build relationship type filter
  let relTypeFilter = '';
  if (relationship_types && relationship_types.length > 0) {
    relTypeFilter = `:${relationship_types.join('|')}`;
  }
  
  const cypher = `
    MATCH path = shortestPath(
      (a:${fromLabel} {${fromProps}})-[${relTypeFilter}*1..${max_depth}]-(b:${toLabel} {${toProps}})
    )
    RETURN path
  `;
  
  // Build parameters
  const params: any = {};
  Object.entries(from_node).forEach(([key, value]) => {
    if (key !== 'label') params[`from_${key}`] = value;
  });
  Object.entries(to_node).forEach(([key, value]) => {
    if (key !== 'label') params[`to_${key}`] = value;
  });
  
  return await fastAPIClient.neo4jQuery(cypher, params);
}

// ============================================================================
// Schema & Admin
// ============================================================================

export async function handleNeo4jSchemaGet(args: any) {
  const cypher = 'CALL db.schema.visualization()';
  return await fastAPIClient.neo4jQuery(cypher);
}

export async function handleNeo4jStatsGet(args: any) {
  const cypher = `
    MATCH (n)
    WITH labels(n) AS labels, count(*) AS nodeCount
    UNWIND labels AS label
    RETURN label, sum(nodeCount) AS count
    ORDER BY count DESC
  `;
  return await fastAPIClient.neo4jQuery(cypher);
}

export async function handleNeo4jConnectionTest(args: any) {
  try {
    const result = await fastAPIClient.neo4jGetLabels();
    return {
      success: true,
      message: 'Connection successful',
      labels: result,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Connection failed',
    };
  }
}

export async function handleNeo4jDatabaseList(args: any) {
  const cypher = 'SHOW DATABASES';
  return await fastAPIClient.neo4jQuery(cypher);
}

export async function handleNeo4jConstraintCreate(args: any) {
  const { constraint_name, label, property, type } = args;
  
  let cypher = '';
  switch (type) {
    case 'UNIQUE':
      cypher = `CREATE CONSTRAINT ${constraint_name} IF NOT EXISTS FOR (n:${label}) REQUIRE n.${property} IS UNIQUE`;
      break;
    case 'EXISTS':
      cypher = `CREATE CONSTRAINT ${constraint_name} IF NOT EXISTS FOR (n:${label}) REQUIRE n.${property} IS NOT NULL`;
      break;
    case 'NODE_KEY':
      cypher = `CREATE CONSTRAINT ${constraint_name} IF NOT EXISTS FOR (n:${label}) REQUIRE n.${property} IS NODE KEY`;
      break;
  }
  
  return await fastAPIClient.neo4jQuery(cypher);
}

