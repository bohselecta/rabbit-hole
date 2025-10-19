import React, { useState, useEffect, useRef } from 'react';
import { Search, Sparkles, GitBranch, FileText, Lightbulb, ChevronRight, RefreshCw, Globe, Share2, Download, Upload, ExternalLink, Maximize2, Minimize2, Network } from 'lucide-react';

const RabbitHoleGenerator = () => {
  const [currentQuery, setCurrentQuery] = useState('');
  const [investigationTree, setInvestigationTree] = useState(null); // Root node of tree
  const [selectedNode, setSelectedNode] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showStarterIdeas, setShowStarterIdeas] = useState(true);
  const [searchResults, setSearchResults] = useState({});
  const [isSearching, setIsSearching] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [viewMode, setViewMode] = useState('tree'); // 'tree' or 'detail'
  const [burrows, setBurrows] = useState([]);
  const [isSearchingBurrows, setIsSearchingBurrows] = useState(false);
  const svgRef = useRef(null);

  const starterTopics = [
    "Show me the strangest historical coincidences",
    "Find the anomalies no one talks about",
    "Reveal the biggest shifts in human thought",
    "Uncover the lost technologies of ancient civilizations",
    "Trace the unexplained patterns in archaeology",
    "Explore the mysteries hidden in plain sight",
    "Connect the dots between distant cultures",
    "Find what mainstream history forgot",
    "Discover the secrets of sacred geometry",
    "Investigate the phenomena science can't explain"
  ];

  const callDeepSeek = async (prompt, systemPrompt) => {
    // For development: direct API calls
    if (import.meta.env.DEV) {
      const apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY;
      const baseURL = import.meta.env.VITE_API_BASE_URL || 'https://api.deepseek.com';
      
      if (!apiKey) {
        throw new Error('API key not configured. Please add VITE_DEEPSEEK_API_KEY to .env.local');
      }

      const response = await fetch(`${baseURL}/v1/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt }
          ],
          max_tokens: 2000,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } else {
      // For production: use serverless function
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, systemPrompt })
      });

      if (!response.ok) {
        throw new Error(`Serverless function failed: ${response.status}`);
      }

      const data = await response.json();
      return data.content;
    }
  };

  const searchForEvidence = async (nodeId, nodeQuery) => {
    setIsSearching(true);
    
    try {
      const systemPrompt = `You are a research assistant helping investigate: "${nodeQuery}"

Your task is to find verifiable information related to this investigation. 

Provide 2-3 key findings that include:
1. Recent scientific papers, archaeological findings, or expert analyses
2. Historical records or documented cases
3. Credible news sources or academic discussions

Synthesize your findings into this JSON format:
{
  "searchesConducted": ["search query 1", "search query 2"],
  "keyFindings": [
    {"finding": "specific finding 1", "source": "brief source description", "url": "example.com"},
    {"finding": "specific finding 2", "source": "brief source description", "url": "example.com"}
  ],
  "newInsights": "2-3 sentences about what these searches revealed that's relevant to the investigation",
  "credibilityNote": "Brief note about the quality/reliability of sources found"
}

DO NOT OUTPUT ANYTHING OTHER THAN VALID JSON. No markdown, no backticks, just pure JSON.`;

      const response = await callDeepSeek(
        `Please research: ${nodeQuery}\n\nFocus on finding verifiable facts, recent discoveries, or expert analyses that are relevant to this investigation.`,
        systemPrompt
      );
      
      let cleanedResponse = response.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const searchData = JSON.parse(cleanedResponse);
      
      setSearchResults(prev => ({
        ...prev,
        [nodeId]: searchData
      }));
    } catch (error) {
      console.error("Error searching for evidence:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const startInvestigation = async (topic) => {
    setIsLoading(true);
    setShowStarterIdeas(false);
    setCurrentQuery(topic);

    try {
      const systemPrompt = `You are an enthusiastic investigative research partner helping explore unusual theories and connections. Your role is to:
1. Take the user's "what if" scenario seriously and explore it thoroughly
2. Identify real facts, archaeological findings, scientific data, or historical records that relate to their theory
3. Suggest fascinating connections and angles they might not have considered
4. Present 3-4 specific follow-up investigation paths they could explore
5. Maintain a balance between open-minded exploration and noting what we actually know

Format your response as JSON with this structure:
{
  "summary": "2-3 sentence overview of why this is fascinating to investigate",
  "knownFacts": ["fact 1", "fact 2", "fact 3"],
  "intriguingConnections": ["connection 1", "connection 2"],
  "followUpPaths": [
    {"question": "specific question 1", "why": "why this matters"},
    {"question": "specific question 2", "why": "why this matters"},
    {"question": "specific question 3", "why": "why this matters"}
  ]
}

DO NOT OUTPUT ANYTHING OTHER THAN VALID JSON. No markdown, no backticks, just pure JSON.`;

      const response = await callDeepSeek(topic, systemPrompt);
      let cleanedResponse = response.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const investigation = JSON.parse(cleanedResponse);

      const rootNode = {
        id: Date.now(),
        query: topic,
        ...investigation,
        children: [],
        depth: 0,
        x: 0,
        y: 0
      };

      setInvestigationTree(rootNode);
      setSelectedNode(rootNode);
    } catch (error) {
      console.error("Error starting investigation:", error);
      alert("Hmm, something went wrong. Let's try that again!");
    } finally {
      setIsLoading(false);
    }
  };

  const followPath = async (parentNode, question) => {
    setIsLoading(true);

    try {
      const pathToNode = getPathToNode(investigationTree, parentNode.id);
      const pathContext = pathToNode.map(node => node.query).join(" → ");
      
      const systemPrompt = `You are continuing a rabbit hole investigation. The investigation so far: ${pathContext}

Now exploring: ${question}

Your role is to:
1. Dig deeper into this specific angle
2. Present concrete facts, studies, or documented cases relevant to this question
3. Highlight any surprising or lesser-known information
4. Suggest 3-4 more specific directions to investigate next
5. Note any legitimate scientific or historical objections to consider

Format your response as JSON with this structure:
{
  "summary": "2-3 sentence overview of what we're exploring here",
  "knownFacts": ["specific fact 1", "specific fact 2", "specific fact 3"],
  "intriguingConnections": ["connection or observation 1", "connection or observation 2"],
  "followUpPaths": [
    {"question": "more specific question 1", "why": "why this matters"},
    {"question": "more specific question 2", "why": "why this matters"},
    {"question": "more specific question 3", "why": "why this matters"}
  ]
}

DO NOT OUTPUT ANYTHING OTHER THAN VALID JSON. No markdown, no backticks, just pure JSON.`;

      const response = await callDeepSeek(question, systemPrompt);
      let cleanedResponse = response.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const investigation = JSON.parse(cleanedResponse);

      const newNode = {
        id: Date.now(),
        query: question,
        ...investigation,
        children: [],
        depth: parentNode.depth + 1,
        x: 0,
        y: 0
      };

      // Add the new node as a child of the parent
      const updatedTree = addChildToNode(investigationTree, parentNode.id, newNode);
      setInvestigationTree(updatedTree);
      setSelectedNode(newNode);
    } catch (error) {
      console.error("Error following path:", error);
      alert("Hit a snag in the investigation. Let's try a different angle!");
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to add a child to a specific node in the tree
  const addChildToNode = (node, parentId, newChild) => {
    if (node.id === parentId) {
      return {
        ...node,
        children: [...node.children, newChild]
      };
    }
    
    return {
      ...node,
      children: node.children.map(child => addChildToNode(child, parentId, newChild))
    };
  };

  // Helper function to get the path from root to a specific node
  const getPathToNode = (node, targetId, currentPath = []) => {
    const newPath = [...currentPath, node];
    
    if (node.id === targetId) {
      return newPath;
    }
    
    for (const child of node.children) {
      const result = getPathToNode(child, targetId, newPath);
      if (result) return result;
    }
    
    return null;
  };

  // Helper function to get all leaf nodes (endpoints)
  const getLeafNodes = (node, leaves = []) => {
    if (node.children.length === 0) {
      leaves.push(node);
    } else {
      node.children.forEach(child => getLeafNodes(child, leaves));
    }
    return leaves;
  };

  // Search for burrows (connections between leaf nodes)
  const searchForBurrows = async () => {
    setIsSearchingBurrows(true);
    
    try {
      const leafNodes = getLeafNodes(investigationTree);
      
      if (leafNodes.length < 2) {
        alert("You need at least 2 investigation endpoints to search for burrows!");
        setIsSearchingBurrows(false);
        return;
      }

      const leafSummaries = leafNodes.map((node, idx) => {
        return `Endpoint ${idx + 1}: ${node.query}\n${node.summary}`;
      }).join('\n\n');

      const systemPrompt = `You are analyzing multiple investigation endpoints to find unexpected connections between them.

Investigation endpoints:
${leafSummaries}

Your task is to find genuine connections, patterns, or relationships between these different investigation endpoints. Look for:
1. Common scientific principles or phenomena
2. Historical or geographical overlaps
3. Technological or methodological similarities
4. Shared expert commentary or research communities
5. Overlapping time periods or cultural contexts

For each connection you find, provide concrete reasoning - not just superficial word associations.

Format your response as JSON:
{
  "burrows": [
    {
      "fromEndpoint": 0,
      "toEndpoint": 1,
      "connection": "detailed description of the connection",
      "strength": "strong/moderate/speculative",
      "evidence": "specific facts or reasoning that support this connection"
    }
  ],
  "overallPattern": "2-3 sentences describing any overarching pattern or theme connecting multiple endpoints"
}

If you find no solid connections, return an empty burrows array and explain why in overallPattern.
DO NOT OUTPUT ANYTHING OTHER THAN VALID JSON. No markdown, no backticks, just pure JSON.`;

      const response = await callDeepSeek("Analyze these investigation endpoints and find connections.", systemPrompt);
      let cleanedResponse = response.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const burrowData = JSON.parse(cleanedResponse);
      
      // Map endpoint indices to actual node IDs
      const burrowsWithIds = burrowData.burrows.map(burrow => ({
        ...burrow,
        fromNode: leafNodes[burrow.fromEndpoint],
        toNode: leafNodes[burrow.toEndpoint]
      }));

      setBurrows(burrowsWithIds);
      alert(`Found ${burrowsWithIds.length} burrow connections!`);
    } catch (error) {
      console.error("Error searching for burrows:", error);
      alert("Hit a snag while digging for burrows!");
    } finally {
      setIsSearchingBurrows(false);
    }
  };

  // Calculate node positions for tree layout
  const calculateTreeLayout = (node, depth = 0, leftBound = 0, rightBound = 1000) => {
    const nodeSpacingY = 180;
    const x = (leftBound + rightBound) / 2;
    const y = depth * nodeSpacingY + 60;

    node.x = x;
    node.y = y;

    if (node.children.length > 0) {
      const childWidth = (rightBound - leftBound) / node.children.length;
      node.children.forEach((child, idx) => {
        const childLeft = leftBound + idx * childWidth;
        const childRight = childLeft + childWidth;
        calculateTreeLayout(child, depth + 1, childLeft, childRight);
      });
    }

    return node;
  };

  // Render the tree visualization
  const renderTree = () => {
    if (!investigationTree) return null;

    const layoutTree = calculateTreeLayout({...investigationTree});
    const allNodes = [];
    const allEdges = [];

    const traverse = (node) => {
      allNodes.push(node);
      node.children.forEach(child => {
        allEdges.push({ from: node, to: child });
        traverse(child);
      });
    };

    traverse(layoutTree);

    // Calculate viewBox
    const minX = Math.min(...allNodes.map(n => n.x)) - 100;
    const maxX = Math.max(...allNodes.map(n => n.x)) + 100;
    const minY = 0;
    const maxY = Math.max(...allNodes.map(n => n.y)) + 100;

    const leafNodes = getLeafNodes(investigationTree);
    const leafIds = new Set(leafNodes.map(n => n.id));

    return (
      <svg
        ref={svgRef}
        viewBox={`${minX} ${minY} ${maxX - minX} ${maxY - minY}`}
        className="w-full h-full"
        style={{ minHeight: '600px' }}
      >
        {/* Draw edges */}
        {allEdges.map((edge, idx) => (
          <line
            key={`edge-${idx}`}
            x1={edge.from.x}
            y1={edge.from.y + 30}
            x2={edge.to.x}
            y2={edge.to.y - 30}
            stroke="#06b6d4"
            strokeWidth="2"
            opacity="0.3"
          />
        ))}

        {/* Draw burrows */}
        {burrows.map((burrow, idx) => (
          <g key={`burrow-${idx}`}>
            <line
              x1={burrow.fromNode.x}
              y1={burrow.fromNode.y}
              x2={burrow.toNode.x}
              y2={burrow.toNode.y}
              stroke={burrow.strength === 'strong' ? '#10b981' : burrow.strength === 'moderate' ? '#f59e0b' : '#6b7280'}
              strokeWidth="3"
              strokeDasharray="5,5"
              opacity="0.6"
            />
            <circle
              cx={(burrow.fromNode.x + burrow.toNode.x) / 2}
              cy={(burrow.fromNode.y + burrow.toNode.y) / 2}
              r="8"
              fill={burrow.strength === 'strong' ? '#10b981' : burrow.strength === 'moderate' ? '#f59e0b' : '#6b7280'}
              onClick={() => alert(`Burrow Connection:\n\n${burrow.connection}\n\nEvidence: ${burrow.evidence}`)}
              className="cursor-pointer"
            />
          </g>
        ))}

        {/* Draw nodes */}
        {allNodes.map((node) => {
          const isSelected = selectedNode?.id === node.id;
          const isLeaf = leafIds.has(node.id);
          
          return (
            <g
              key={node.id}
              transform={`translate(${node.x}, ${node.y})`}
              onClick={() => setSelectedNode(node)}
              className="cursor-pointer"
            >
              <circle
                r="30"
                fill={isSelected ? '#06b6d4' : isLeaf ? '#ec4899' : '#0891b2'}
                stroke={isSelected ? '#fbbf24' : '#06b6d4'}
                strokeWidth={isSelected ? 3 : 2}
                opacity="0.9"
              />
              {isLeaf && (
                <circle
                  r="35"
                  fill="none"
                  stroke="#ec4899"
                  strokeWidth="2"
                  strokeDasharray="3,3"
                  opacity="0.5"
                />
              )}
              <text
                textAnchor="middle"
                dy="-40"
                fontSize="12"
                fill="#e0e7ff"
                className="pointer-events-none"
              >
                {node.query.length > 30 ? node.query.substring(0, 30) + '...' : node.query}
              </text>
              {node.depth === 0 && (
                <text
                  textAnchor="middle"
                  dy="5"
                  fontSize="14"
                  fill="white"
                  fontWeight="bold"
                  className="pointer-events-none"
                >
                  ROOT
                </text>
              )}
              {isLeaf && (
                <text
                  textAnchor="middle"
                  dy="50"
                  fontSize="10"
                  fill="#fbbf24"
                  className="pointer-events-none"
                >
                  endpoint
                </text>
              )}
            </g>
          );
        })}
      </svg>
    );
  };

  const exportInvestigation = () => {
    const exportData = {
      timestamp: new Date().toISOString(),
      investigationTree: investigationTree,
      searchResults: searchResults,
      burrows: burrows
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rabbit-hole-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const copyShareableText = () => {
    const allNodes = [];
    const traverse = (node) => {
      allNodes.push(node);
      node.children.forEach(child => traverse(child));
    };
    traverse(investigationTree);

    const pathText = allNodes.map((node, idx) => {
      let text = `\n${'='.repeat(60)}\n`;
      text += `NODE ${idx + 1} [Depth ${node.depth}]: ${node.query}\n`;
      text += `${'='.repeat(60)}\n\n`;
      text += `${node.summary}\n\n`;
      text += `KNOWN FACTS:\n`;
      node.knownFacts.forEach((fact, i) => {
        text += `${i + 1}. ${fact}\n`;
      });
      text += `\nINTRIGUING CONNECTIONS:\n`;
      node.intriguingConnections.forEach((conn, i) => {
        text += `${i + 1}. ${conn}\n`;
      });
      
      if (searchResults[node.id]) {
        text += `\nWEB SEARCH FINDINGS:\n`;
        searchResults[node.id].keyFindings.forEach((finding, i) => {
          text += `${i + 1}. ${finding.finding}\n   Source: ${finding.source}\n`;
          if (finding.url) text += `   URL: ${finding.url}\n`;
        });
      }
      
      return text;
    }).join('\n');
    
    let burrowText = '';
    if (burrows.length > 0) {
      burrowText = `\n\n${'='.repeat(60)}\nBURROW CONNECTIONS\n${'='.repeat(60)}\n\n`;
      burrows.forEach((burrow, idx) => {
        burrowText += `Burrow ${idx + 1} [${burrow.strength}]:\n`;
        burrowText += `Between: "${burrow.fromNode.query}" and "${burrow.toNode.query}"\n`;
        burrowText += `Connection: ${burrow.connection}\n`;
        burrowText += `Evidence: ${burrow.evidence}\n\n`;
      });
    }
    
    const fullText = `THE RABBIT HOLE GENERATOR - Investigation Map\nGenerated: ${new Date().toLocaleString()}\n${pathText}${burrowText}`;
    
    navigator.clipboard.writeText(fullText).then(() => {
      alert('Investigation copied to clipboard! Share it wherever you like.');
    });
  };

  const importInvestigation = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        setInvestigationTree(importedData.investigationTree || null);
        setSearchResults(importedData.searchResults || {});
        setBurrows(importedData.burrows || []);
        setShowStarterIdeas(false);
        if (importedData.investigationTree) {
          setSelectedNode(importedData.investigationTree);
        }
        alert('Investigation loaded successfully!');
      } catch (error) {
        alert('Error loading investigation file. Make sure it\'s a valid export.');
      }
    };
    reader.readAsText(file);
  };

  const resetInvestigation = () => {
    setInvestigationTree(null);
    setSelectedNode(null);
    setCurrentQuery('');
    setShowStarterIdeas(true);
    setBurrows([]);
    setSearchResults({});
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              {/* Rabbit Logo */}
              <img 
                src="/rh-logo-graphic-mark.svg" 
                alt="Rabbit Hole Logo" 
                className="h-12 w-auto"
              />
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-wider text-gray-100">
                  RABBIT HOLE
                </h1>
                <p className="text-cyan-400 text-sm">Investigation Network</p>
              </div>
            </div>
            
            {/* Import Button - moved to header */}
            {!investigationTree && (
              <label className="bg-slate-900/80 hover:bg-slate-800 border border-cyan-500/30 hover:border-cyan-400/50 rounded-lg px-4 py-2 font-medium flex items-center gap-2 transition-all text-sm cursor-pointer">
                <Upload className="w-4 h-4" />
                Import
                <input
                  type="file"
                  accept=".json"
                  onChange={importInvestigation}
                  className="hidden"
                />
              </label>
            )}
            
            {investigationTree && (
              <button className="text-gray-400 hover:text-gray-200">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}
          </div>
          
          {/* Controls */}
          {investigationTree && (
            <div className="flex items-center justify-center gap-2 md:gap-3 flex-wrap">
              <button
                onClick={() => setViewMode(viewMode === 'tree' ? 'detail' : 'tree')}
                className="bg-slate-900/80 hover:bg-slate-800 border border-cyan-500/30 hover:border-cyan-400/50 rounded-lg px-3 md:px-4 py-2 font-medium flex items-center gap-2 transition-all text-sm"
              >
                {viewMode === 'tree' ? <FileText className="w-4 h-4" /> : <Network className="w-4 h-4" />}
                {viewMode === 'tree' ? 'Detail' : 'Map'}
              </button>
              <button
                onClick={searchForBurrows}
                disabled={isSearchingBurrows}
                className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 rounded-lg px-3 md:px-4 py-2 font-medium flex items-center gap-2 transition-all text-sm shadow-lg shadow-cyan-500/20"
              >
                <Network className="w-4 h-4" />
                {isSearchingBurrows ? 'Digging...' : 'Find Burrows'}
              </button>
              <button
                onClick={() => setShowShareModal(true)}
                className="bg-slate-900/80 hover:bg-slate-800 border border-cyan-500/30 hover:border-cyan-400/50 rounded-lg px-3 md:px-4 py-2 font-medium flex items-center gap-2 transition-all text-sm"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
              <button
                onClick={exportInvestigation}
                className="bg-slate-900/80 hover:bg-slate-800 border border-cyan-500/30 hover:border-cyan-400/50 rounded-lg px-3 md:px-4 py-2 font-medium flex items-center gap-2 transition-all text-sm"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
              <button
                onClick={resetInvestigation}
                className="bg-slate-900/80 hover:bg-slate-800 border border-red-500/30 hover:border-red-400/50 rounded-lg px-3 md:px-4 py-2 font-medium flex items-center gap-2 transition-all text-sm"
              >
                <RefreshCw className="w-4 h-4" />
                New
              </button>
            </div>
          )}

        </div>

        {/* Share Modal */}
        {showShareModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setShowShareModal(false)}>
            <div className="bg-slate-900 border border-cyan-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl shadow-cyan-500/10" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-xl font-bold mb-4 text-gray-100">Share Your Investigation</h3>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    copyShareableText();
                    setShowShareModal(false);
                  }}
                  className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-lg px-4 py-3 font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-500/20"
                >
                  <FileText className="w-5 h-5" />
                  Copy as Text
                </button>
                <button
                  onClick={() => {
                    exportInvestigation();
                    setShowShareModal(false);
                  }}
                  className="w-full bg-slate-800 hover:bg-slate-700 border border-cyan-500/30 rounded-lg px-4 py-3 font-semibold flex items-center justify-center gap-2 transition-all"
                >
                  <Download className="w-5 h-5" />
                  Download JSON File
                </button>
              </div>
              <button
                onClick={() => setShowShareModal(false)}
                className="mt-4 w-full text-cyan-400 hover:text-cyan-300 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Custom Query Input - Circular Entry Point */}
        {!investigationTree && (
          <div className="flex flex-col items-center justify-center mb-8">
            {/* Circular Enter Button */}
            <div className="relative mb-8">
              <div className="absolute inset-0 rounded-full bg-cyan-500/20 blur-2xl"></div>
              
              {/* Flowing Filament Animation */}
              <div className="absolute inset-0 rounded-full overflow-hidden">
                <svg className="w-full h-full" viewBox="0 0 256 256">
                  <defs>
                    <radialGradient id="filamentGradient" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="transparent" />
                      <stop offset="70%" stopColor="transparent" />
                      <stop offset="85%" stopColor="#06b6d4" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.8" />
                    </radialGradient>
                  </defs>
                  
                  {/* Animated filaments */}
                  {Array.from({ length: 12 }, (_, i) => {
                    const angle = (i * 30) * (Math.PI / 180);
                    const radius = 128;
                    const x = 128 + Math.cos(angle) * radius;
                    const y = 128 + Math.sin(angle) * radius;
                    
                    return (
                      <g key={i}>
                        {/* Flowing particle */}
                        <circle
                          cx={x}
                          cy={y}
                          r="2"
                          fill="#06b6d4"
                          opacity="0.6"
                          className="animate-flowing-particle"
                          style={{
                            animationDelay: `${i * 0.2}s`,
                            animationDuration: '3s',
                            animationIterationCount: 'infinite',
                            animationTimingFunction: 'ease-in-out'
                          }}
                        />
                        {/* Trail effect */}
                        <circle
                          cx={x}
                          cy={y}
                          r="1"
                          fill="#06b6d4"
                          opacity="0.3"
                          className="animate-flowing-trail"
                          style={{
                            animationDelay: `${i * 0.2 + 0.1}s`,
                            animationDuration: '3s',
                            animationIterationCount: 'infinite',
                            animationTimingFunction: 'ease-in-out'
                          }}
                        />
                      </g>
                    );
                  })}
                  
                  {/* Corona effect */}
                  <circle
                    cx="128"
                    cy="128"
                    r="120"
                    fill="none"
                    stroke="url(#filamentGradient)"
                    strokeWidth="2"
                    className="animate-corona-pulse"
                    style={{
                      animationDuration: '4s',
                      animationIterationCount: 'infinite',
                      animationTimingFunction: 'ease-in-out'
                    }}
                  />
                </svg>
              </div>
              
              <button
                onClick={() => {
                  const randomTopic = starterTopics[Math.floor(Math.random() * starterTopics.length)];
                  startInvestigation(randomTopic);
                }}
                disabled={isLoading}
                className="relative w-64 h-64 rounded-full border-4 border-cyan-500/40 hover:border-cyan-400/60 transition-all duration-300 flex items-center justify-center group disabled:opacity-50"
              >
                <div className="absolute inset-4 rounded-full border-2 border-cyan-500/30 group-hover:border-cyan-400/50 transition-all"></div>
                <div className="text-center z-10">
                  <div className="text-2xl font-bold tracking-wider text-gray-100 mb-2">ENTER</div>
                  <div className="text-lg tracking-wide text-cyan-400">THE RABBIT</div>
                  <div className="text-lg tracking-wide text-cyan-400">HOLE</div>
                </div>
              </button>
            </div>

            {/* Custom Input */}
            <div className="w-full max-w-2xl">
              <div className="text-center mb-4">
                <p className="text-gray-400 text-sm">Or enter your own investigation:</p>
              </div>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={currentQuery}
                  onChange={(e) => setCurrentQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && currentQuery.trim() && startInvestigation(currentQuery)}
                  placeholder="What mysteries call to you..."
                  className="flex-1 bg-slate-900/80 border border-cyan-500/30 focus:border-cyan-400/50 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none transition-all"
                />
                <button
                  onClick={() => currentQuery.trim() && startInvestigation(currentQuery)}
                  disabled={!currentQuery.trim() || isLoading}
                  className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg px-6 py-3 font-medium flex items-center gap-2 transition-all shadow-lg shadow-cyan-500/20"
                >
                  <Search className="w-5 h-5" />
                  Begin
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Starter Ideas */}
        {showStarterIdeas && !investigationTree && (
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-6">
              <p className="text-gray-400">Or choose a path below...</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {starterTopics.map((topic, idx) => (
                <button
                  key={idx}
                  onClick={() => startInvestigation(topic)}
                  disabled={isLoading}
                  className="bg-slate-900/60 hover:bg-slate-800/80 border border-cyan-500/20 hover:border-cyan-400/40 rounded-xl p-5 text-left transition-all group disabled:opacity-50 shadow-lg shadow-black/20"
                >
                  <p className="text-gray-200 group-hover:text-white font-medium tracking-wide uppercase text-sm leading-relaxed">{topic}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="bg-slate-900/80 backdrop-blur rounded-xl p-8 border border-cyan-500/30 mb-6 shadow-lg shadow-cyan-500/10">
            <div className="flex items-center justify-center gap-3">
              <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin" />
              <p className="text-gray-300 text-lg">Following the thread...</p>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        {investigationTree && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Tree Visualization */}
            <div className={`${viewMode === 'tree' ? 'lg:col-span-2' : 'lg:col-span-3'} bg-slate-900/60 backdrop-blur rounded-xl p-6 border border-cyan-500/20 shadow-xl shadow-black/40`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-100 flex items-center gap-2">
                  <Network className="w-6 h-6 text-cyan-400" />
                  Investigation Map
                </h2>
                {burrows.length > 0 && (
                  <div className="flex items-center gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                      <span className="text-emerald-400">Strong</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                      <span className="text-amber-400">Moderate</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                      <span className="text-gray-400">Speculative</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="bg-slate-950/50 rounded-lg overflow-auto border border-cyan-500/10">
                {renderTree()}
              </div>
              <p className="text-gray-500 text-xs mt-3 text-center">
                Click on any node to view details and branch from that point • Pink circles are investigation endpoints • Dashed lines are burrow connections
              </p>
            </div>

            {/* Detail Panel */}
            {viewMode === 'tree' && selectedNode && (
              <div className="lg:col-span-1 space-y-6">
                {/* Node Details */}
                <div className="bg-slate-900/60 backdrop-blur rounded-xl p-6 border border-cyan-500/20 shadow-xl shadow-black/40">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-100">Selected Node</h3>
                    <button
                      onClick={() => searchForEvidence(selectedNode.id, selectedNode.query)}
                      disabled={isSearching || searchResults[selectedNode.id]}
                      className="bg-slate-800 hover:bg-slate-700 disabled:opacity-50 border border-cyan-500/30 rounded-lg px-3 py-1 text-xs font-medium flex items-center gap-1"
                    >
                      <Globe className="w-3 h-3" />
                      {searchResults[selectedNode.id] ? '✓' : 'Search'}
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-cyan-400 text-sm font-semibold mb-1">Query:</p>
                      <p className="text-gray-200 text-sm">{selectedNode.query}</p>
                    </div>
                    
                    <div>
                      <p className="text-cyan-400 text-sm font-semibold mb-1">Summary:</p>
                      <p className="text-gray-300 text-sm leading-relaxed">{selectedNode.summary}</p>
                    </div>

                    <div>
                      <p className="text-emerald-400 text-sm font-semibold mb-2">Known Facts:</p>
                      <ul className="space-y-2">
                        {selectedNode.knownFacts.map((fact, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-xs text-gray-300">
                            <span className="text-emerald-400">•</span>
                            <span>{fact}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <p className="text-amber-400 text-sm font-semibold mb-2">Connections:</p>
                      <ul className="space-y-2">
                        {selectedNode.intriguingConnections.map((conn, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-xs text-gray-300">
                            <span className="text-amber-400">•</span>
                            <span>{conn}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Web Search Results */}
                    {searchResults[selectedNode.id] && (
                      <div className="border-t border-cyan-500/20 pt-4">
                        <p className="text-blue-400 text-sm font-semibold mb-2">Web Evidence:</p>
                        <div className="space-y-2">
                          {searchResults[selectedNode.id].keyFindings.map((finding, idx) => (
                            <div key={idx} className="bg-slate-950/50 p-2 rounded border border-cyan-500/10 text-xs">
                              <p className="text-gray-200 mb-1">{finding.finding}</p>
                              <p className="text-blue-400/70">{finding.source}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Branch Options */}
                <div className="bg-slate-900/60 backdrop-blur rounded-xl p-6 border border-cyan-500/20 shadow-xl shadow-black/40">
                  <h3 className="text-lg font-bold text-gray-100 mb-4 flex items-center gap-2">
                    <GitBranch className="w-5 h-5 text-cyan-400" />
                    Branch from here
                  </h3>
                  <div className="space-y-2">
                    {selectedNode.followUpPaths.map((path, idx) => (
                      <button
                        key={idx}
                        onClick={() => followPath(selectedNode, path.question)}
                        disabled={isLoading}
                        className="w-full bg-slate-950/50 hover:bg-slate-800/50 border border-cyan-500/20 hover:border-cyan-400/40 rounded-lg p-3 text-left transition-all disabled:opacity-50"
                      >
                        <p className="text-gray-200 font-medium text-sm mb-1">{path.question}</p>
                        <p className="text-gray-400 text-xs">{path.why}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>Click any node to explore from that point • Create multiple branches • Search for burrows to find hidden connections</p>
        </div>
      </div>
    </div>
  );
};

export default RabbitHoleGenerator;
