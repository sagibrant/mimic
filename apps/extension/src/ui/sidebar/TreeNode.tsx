/**
 * @copyright 2026 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file TreeNode.tsx
 * @description 
 * Sidebar task tree node component
 * 
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { useState, useEffect, useRef } from 'react';
import './TreeNode.css';
import { Package, PackageOpen, SquareFunction } from 'lucide-react';

export interface TreeNodeType {
  id: string;
  name: string;
  type: 'group' | 'task';
  children?: TreeNodeType[];
}

interface TreeNodeProps {
  node: TreeNodeType;
  activeNodeId: string;
  depth?: number;
  onNodeSelected: (nodeId: string) => void;
  onTaskSelected: (taskId: string) => void;
  onRenameNode: (nodeId: string, newName: string) => void;
}

export default function TreeNode({
  node,
  activeNodeId,
  depth = 0,
  onNodeSelected,
  onTaskSelected,
  onRenameNode
}: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(node.type === 'group' ? true : false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(node.name);
  const editInputRef = useRef<HTMLInputElement>(null);

  const isActive = node.id === activeNodeId;

  useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [isEditing]);

  const handleIconsClick = () => {
    if (node.type === 'group') {
      setIsExpanded(!isExpanded);
    }
    onNodeSelected(node.id);
    if (node.type === 'task') {
      onTaskSelected(node.id);
    }
  };

  const handleClick = () => {
    onNodeSelected(node.id);
    if (node.type === 'task') {
      onTaskSelected(node.id);
    }
  };

  const handleDoubleClick = () => {
    setIsEditing(true);
    setEditedName(node.name);
  };

  const saveName = () => {
    const trimmedName = editedName.trim();
    if (trimmedName && trimmedName !== node.name) {
      onRenameNode(node.id, trimmedName);
    }
    setIsEditing(false);
  };

  const cancelEdit = () => {
    setIsEditing(false);
  };

  return (
    <div className="tree-node">
      <div className="node-content">
        {/* Indentation guides */}
        {Array.from({ length: depth }).map((_, index) => (
          <div key={index} className={`indent-guide ${index === depth - 1 ? 'last' : ''}`}></div>
        ))}

        {/* Expand/collapse icon */}
        {/* {node.type === 'group' && (
          <span className="node-icon">
            {isExpanded ? '▼' : '▶'}
          </span>
        )} */}

        {/* Node label */}
        {!isEditing ? (
          <span className={`node-label ${isActive ? 'active' : ''}`}>
            <span className="node-type-icon" onClick={(e) => {
              e.stopPropagation();
              handleIconsClick();
            }}>
              {node.type === 'group' ?
                (
                  isExpanded ? (<PackageOpen size={16} />) : (<Package size={16} />)
                ) :
                (
                  <SquareFunction size={16} />
                )
              }
            </span>
            <span className="node-name" onClick={handleClick} onDoubleClick={handleDoubleClick}>
              {node.name}
            </span>
          </span>
        ) : (
          <span className="node-edit">
            <input
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveName();
                if (e.key === 'Escape') cancelEdit();
              }}
              onBlur={saveName}
              ref={editInputRef}
            />
          </span>
        )}
      </div>

      {/* Child nodes */}
      {node.type === 'group' && isExpanded && node.children && (
        <div className="node-children">
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              activeNodeId={activeNodeId}
              depth={depth + 1}
              onNodeSelected={onNodeSelected}
              onTaskSelected={onTaskSelected}
              onRenameNode={onRenameNode}
            />
          ))}
        </div>
      )}
    </div>
  );
};
