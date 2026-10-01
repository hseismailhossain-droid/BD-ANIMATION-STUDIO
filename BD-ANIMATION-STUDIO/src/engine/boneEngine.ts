/**
 * Bone Rigging Engine (ব্লেন্ডার ও মোহো স্টাইল হাড় / বোন রিগিং ইঞ্জিন)
 * Enables 2D skeletal rigging, hierarchical forward kinematics (FK),
 * and real-time linear blend skinning / mesh deformation for characters and drawings.
 */

import { WarpEngine, MeshWarpGrid, MeshWarpNode } from './warpEngine';

export interface Bone {
  id: string;
  name: string;
  parentId: string | null;
  // Current pose positions:
  head: { x: number; y: number }; // Root joint / pivot
  tail: { x: number; y: number }; // Tip joint
  // Rest (binding) positions:
  restHead: { x: number; y: number };
  restTail: { x: number; y: number };
  length: number;
  strength: number; // Influence radius in pixels
  color: string;
}

export interface BoneSkinningWeight {
  boneId: string;
  weight: number;
}

export interface BoneRigState {
  isActive: boolean;
  layerId: string;
  bones: Bone[];
  selectedBoneId: string | null;
  mode: 'pose' | 'add' | 'edit'; // 'pose': manipulate & move, 'add': draw new bones, 'edit': adjust joints
  showInfluence: boolean;
  sourceSnapshot: HTMLCanvasElement | null;
  bounds: { x: number; y: number; width: number; height: number };
  // Pre-calculated deformation grid and vertex weights
  grid: MeshWarpGrid | null;
  gridWeights: BoneSkinningWeight[][][]; // [row][col] => array of { boneId, weight }
}

export type BonePreset = 'arm' | 'spine' | 'tail' | 'pin';

export class BoneEngine {
  /**
   * Calculate distance from a point (px, py) to a line segment [p1, p2]
   */
  public static distToSegment(
    px: number,
    py: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return Math.hypot(px - x1, py - y1);

    // Projection parameter t
    let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));

    const projX = x1 + t * dx;
    const projY = y1 + t * dy;
    return Math.hypot(px - projX, py - projY);
  }

  /**
   * Create an initial Bone Rig from presets based on layer content bounds
   */
  public static createRigPreset(
    preset: BonePreset,
    bounds: { x: number; y: number; width: number; height: number }
  ): Bone[] {
    const { x, y, width: w, height: h } = bounds;
    const cx = x + w / 2;
    const cy = y + h / 2;

    switch (preset) {
      case 'arm': {
        // 3-joint chain: Shoulder -> Elbow -> Hand
        const shoulderY = y + h * 0.2;
        const elbowY = y + h * 0.55;
        const handY = y + h * 0.9;
        const b1: Bone = {
          id: `bone_shoulder_${Date.now()}`,
          name: 'Shoulder (কাঁধ)',
          parentId: null,
          head: { x: cx, y: shoulderY },
          tail: { x: cx, y: elbowY },
          restHead: { x: cx, y: shoulderY },
          restTail: { x: cx, y: elbowY },
          length: elbowY - shoulderY,
          strength: Math.max(70, w * 0.45),
          color: '#38bdf8',
        };
        const b2: Bone = {
          id: `bone_elbow_${Date.now() + 1}`,
          name: 'Forearm (কনুই)',
          parentId: b1.id,
          head: { x: cx, y: elbowY },
          tail: { x: cx, y: handY },
          restHead: { x: cx, y: elbowY },
          restTail: { x: cx, y: handY },
          length: handY - elbowY,
          strength: Math.max(60, w * 0.4),
          color: '#fb923c',
        };
        const b3: Bone = {
          id: `bone_hand_${Date.now() + 2}`,
          name: 'Hand (হাত)',
          parentId: b2.id,
          head: { x: cx, y: handY },
          tail: { x: cx + 25, y: handY + h * 0.15 },
          restHead: { x: cx, y: handY },
          restTail: { x: cx + 25, y: handY + h * 0.15 },
          length: Math.hypot(25, h * 0.15),
          strength: Math.max(50, w * 0.35),
          color: '#a855f7',
        };
        return [b1, b2, b3];
      }

      case 'spine': {
        // Torso & Head: Root -> Chest -> Head
        const rootY = y + h * 0.85;
        const chestY = y + h * 0.5;
        const neckY = y + h * 0.25;
        const topY = y + h * 0.05;
        const bRoot: Bone = {
          id: `bone_pelvis_${Date.now()}`,
          name: 'Pelvis / Root (কোমর)',
          parentId: null,
          head: { x: cx, y: rootY },
          tail: { x: cx, y: chestY },
          restHead: { x: cx, y: rootY },
          restTail: { x: cx, y: chestY },
          length: rootY - chestY,
          strength: Math.max(80, w * 0.5),
          color: '#10b981',
        };
        const bChest: Bone = {
          id: `bone_chest_${Date.now() + 1}`,
          name: 'Spine / Chest (বুক)',
          parentId: bRoot.id,
          head: { x: cx, y: chestY },
          tail: { x: cx, y: neckY },
          restHead: { x: cx, y: chestY },
          restTail: { x: cx, y: neckY },
          length: chestY - neckY,
          strength: Math.max(75, w * 0.48),
          color: '#06b6d4',
        };
        const bHead: Bone = {
          id: `bone_head_${Date.now() + 2}`,
          name: 'Head (মাথা)',
          parentId: bChest.id,
          head: { x: cx, y: neckY },
          tail: { x: cx, y: topY },
          restHead: { x: cx, y: neckY },
          restTail: { x: cx, y: topY },
          length: neckY - topY,
          strength: Math.max(65, w * 0.45),
          color: '#ec4899',
        };
        return [bRoot, bChest, bHead];
      }

      case 'tail': {
        // Snake / Tail 4-chain
        const step = h / 4.2;
        const bones: Bone[] = [];
        const colors = ['#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'];
        let prevId: string | null = null;
        for (let i = 0; i < 4; i++) {
          const hy = y + i * step + step * 0.2;
          const ty = hy + step;
          const id = `bone_seg_${Date.now()}_${i}`;
          bones.push({
            id,
            name: `Segment ${i + 1} (হাড় ${i + 1})`,
            parentId: prevId,
            head: { x: cx, y: hy },
            tail: { x: cx, y: ty },
            restHead: { x: cx, y: hy },
            restTail: { x: cx, y: ty },
            length: step,
            strength: Math.max(60, w * 0.4),
            color: colors[i % colors.length],
          });
          prevId = id;
        }
        return bones;
      }

      case 'pin':
      default: {
        // Single central pivot bone for translating and rotating any object
        const b: Bone = {
          id: `bone_pin_${Date.now()}`,
          name: 'Center Pivot (মূল হাড়)',
          parentId: null,
          head: { x: cx, y: cy },
          tail: { x: cx, y: cy - h * 0.35 },
          restHead: { x: cx, y: cy },
          restTail: { x: cx, y: cy - h * 0.35 },
          length: h * 0.35,
          strength: Math.max(100, Math.hypot(w, h) * 0.6),
          color: '#06b6d4',
        };
        return [b];
      }
    }
  }

  /**
   * Build deformation grid and skinning weights for each grid vertex
   */
  public static buildDeformationGrid(
    bounds: { x: number; y: number; width: number; height: number },
    bones: Bone[],
    divX: number = 8,
    divY: number = 8
  ): { grid: MeshWarpGrid; gridWeights: BoneSkinningWeight[][][] } {
    const grid = WarpEngine.createMeshGrid(bounds, divX, divY);
    const gridWeights: BoneSkinningWeight[][][] = [];

    for (let r = 0; r < grid.rows; r++) {
      gridWeights[r] = [];
      for (let c = 0; c < grid.cols; c++) {
        const node = grid.nodes[r][c];
        const weights: BoneSkinningWeight[] = [];
        let totalWeight = 0;

        for (const bone of bones) {
          const dist = this.distToSegment(
            node.origX,
            node.origY,
            bone.restHead.x,
            bone.restHead.y,
            bone.restTail.x,
            bone.restTail.y
          );
          // Inverse square falloff based on bone strength
          const normalizedDist = dist / Math.max(1, bone.strength);
          if (normalizedDist < 1.0) {
            const rawWeight = Math.pow(1.0 - normalizedDist, 2.2);
            weights.push({ boneId: bone.id, weight: rawWeight });
            totalWeight += rawWeight;
          }
        }

        // If a point falls outside all bone radii, bind to closest bone
        if (totalWeight < 0.0001 && bones.length > 0) {
          let closestBone = bones[0];
          let minDist = Infinity;
          for (const bone of bones) {
            const dist = this.distToSegment(
              node.origX,
              node.origY,
              bone.restHead.x,
              bone.restHead.y,
              bone.restTail.x,
              bone.restTail.y
            );
            if (dist < minDist) {
              minDist = dist;
              closestBone = bone;
            }
          }
          gridWeights[r][c] = [{ boneId: closestBone.id, weight: 1.0 }];
        } else {
          // Normalize weights
          gridWeights[r][c] = weights.map((w) => ({
            boneId: w.boneId,
            weight: w.weight / totalWeight,
          }));
        }
      }
    }

    return { grid, gridWeights };
  }

  /**
   * Forward Kinematics: Transform a point according to a single bone's transformation
   */
  public static transformPointWithBone(
    px: number,
    py: number,
    bone: Bone
  ): { x: number; y: number } {
    const rx = px - bone.restHead.x;
    const ry = py - bone.restHead.y;

    const restDx = bone.restTail.x - bone.restHead.x;
    const restDy = bone.restTail.y - bone.restHead.y;
    const restAngle = Math.atan2(restDy, restDx);

    const curDx = bone.tail.x - bone.head.x;
    const curDy = bone.tail.y - bone.head.y;
    const curAngle = Math.atan2(curDy, curDx);
    const deltaAngle = curAngle - restAngle;

    // Scale along bone length if stretched
    const curLen = Math.hypot(curDx, curDy);
    const restLen = Math.max(1, Math.hypot(restDx, restDy));
    const scale = curLen / restLen;

    const cos = Math.cos(deltaAngle);
    const sin = Math.sin(deltaAngle);

    const rotX = (rx * cos - ry * sin) * scale;
    const rotY = (rx * sin + ry * cos) * scale;

    return {
      x: bone.head.x + rotX,
      y: bone.head.y + rotY,
    };
  }

  /**
   * Update all nodes in the deformation grid based on current bone poses using LBS
   */
  public static deformGridWithBones(
    grid: MeshWarpGrid,
    gridWeights: BoneSkinningWeight[][][],
    bones: Bone[]
  ) {
    const boneMap = new Map<string, Bone>();
    for (const b of bones) boneMap.set(b.id, b);

    for (let r = 0; r < grid.rows; r++) {
      for (let c = 0; c < grid.cols; c++) {
        const node = grid.nodes[r][c];
        const weights = gridWeights[r]?.[c];
        if (!weights || weights.length === 0) continue;

        let finalX = 0;
        let finalY = 0;

        for (const item of weights) {
          const bone = boneMap.get(item.boneId);
          if (!bone) continue;
          const transformed = this.transformPointWithBone(node.origX, node.origY, bone);
          finalX += transformed.x * item.weight;
          finalY += transformed.y * item.weight;
        }

        node.x = finalX;
        node.y = finalY;
      }
    }
  }

  /**
   * Rotate a bone and all its descendant children around its head joint (FK Chain)
   */
  public static rotateBoneChain(
    bones: Bone[],
    targetBoneId: string,
    deltaAngle: number
  ) {
    const target = bones.find((b) => b.id === targetBoneId);
    if (!target) return;

    // Gather all descendants
    const descendantIds = new Set<string>([targetBoneId]);
    let added = true;
    while (added) {
      added = false;
      for (const b of bones) {
        if (b.parentId && descendantIds.has(b.parentId) && !descendantIds.has(b.id)) {
          descendantIds.add(b.id);
          added = true;
        }
      }
    }

    const pivot = target.head;
    const cos = Math.cos(deltaAngle);
    const sin = Math.sin(deltaAngle);

    const rotatePoint = (pt: { x: number; y: number }) => {
      const rx = pt.x - pivot.x;
      const ry = pt.y - pivot.y;
      return {
        x: pivot.x + (rx * cos - ry * sin),
        y: pivot.y + (rx * sin + ry * cos),
      };
    };

    for (const b of bones) {
      if (descendantIds.has(b.id)) {
        if (b.id !== targetBoneId) {
          b.head = rotatePoint(b.head);
        }
        b.tail = rotatePoint(b.tail);
      }
    }
  }

  /**
   * Translate a bone and all its descendant children (FK Move)
   */
  public static translateBoneChain(
    bones: Bone[],
    targetBoneId: string,
    dx: number,
    dy: number
  ) {
    const target = bones.find((b) => b.id === targetBoneId);
    if (!target) return;

    // If target has no parent (root), translate whole skeleton or its descendants
    const descendantIds = new Set<string>([targetBoneId]);
    let added = true;
    while (added) {
      added = false;
      for (const b of bones) {
        if (b.parentId && descendantIds.has(b.parentId) && !descendantIds.has(b.id)) {
          descendantIds.add(b.id);
          added = true;
        }
      }
    }

    for (const b of bones) {
      if (descendantIds.has(b.id)) {
        b.head.x += dx;
        b.head.y += dy;
        b.tail.x += dx;
        b.tail.y += dy;
      }
    }
  }

  /**
   * Reset all bones to their original Rest (Bind) pose
   */
  public static resetToRestPose(bones: Bone[]) {
    for (const b of bones) {
      b.head = { ...b.restHead };
      b.tail = { ...b.restTail };
    }
  }

  /**
   * Update Rest pose to match current pose (Re-bind)
   */
  public static bakeCurrentAsRestPose(bones: Bone[]) {
    for (const b of bones) {
      b.restHead = { ...b.head };
      b.restTail = { ...b.tail };
    }
  }

  /**
   * Hit test for interactive manipulation (Head joint, Tail joint, Body)
   */
  public static hitTestBone(
    bones: Bone[],
    px: number,
    py: number,
    zoom: number
  ): {
    bone: Bone;
    part: 'head' | 'tail' | 'body';
  } | null {
    const hitRadius = Math.max(14, 18 / zoom);

    // 1. Check joints first (tail & head)
    for (const b of bones) {
      if (Math.hypot(b.tail.x - px, b.tail.y - py) <= hitRadius) {
        return { bone: b, part: 'tail' };
      }
      if (Math.hypot(b.head.x - px, b.head.y - py) <= hitRadius) {
        return { bone: b, part: 'head' };
      }
    }

    // 2. Check bone body
    for (const b of bones) {
      const dist = this.distToSegment(px, py, b.head.x, b.head.y, b.tail.x, b.tail.y);
      if (dist <= hitRadius * 0.9) {
        return { bone: b, part: 'body' };
      }
    }

    return null;
  }

  /**
   * Render classic Blender / Moho octahedral diamond bones and joint nodes
   */
  public static renderBonesOverlay(
    ctx: CanvasRenderingContext2D,
    bones: Bone[],
    selectedBoneId: string | null,
    showInfluence: boolean,
    zoom: number
  ) {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const invZoom = 1 / Math.max(0.1, zoom);

    // 1. Render influence capsules if enabled
    if (showInfluence) {
      for (const b of bones) {
        const isSelected = b.id === selectedBoneId;
        ctx.beginPath();
        ctx.arc(b.head.x, b.head.y, b.strength, 0, Math.PI * 2);
        ctx.arc(b.tail.x, b.tail.y, b.strength, 0, Math.PI * 2);
        ctx.fillStyle = isSelected
          ? 'rgba(6, 182, 212, 0.12)'
          : 'rgba(255, 255, 255, 0.04)';
        ctx.fill();
        ctx.strokeStyle = isSelected
          ? 'rgba(6, 182, 212, 0.5)'
          : 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1 * invZoom;
        ctx.setLineDash([4 * invZoom, 4 * invZoom]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // 2. Render bone hierarchy connecting lines
    for (const b of bones) {
      if (b.parentId) {
        const parent = bones.find((p) => p.id === b.parentId);
        if (parent) {
          ctx.beginPath();
          ctx.moveTo(parent.tail.x, parent.tail.y);
          ctx.lineTo(b.head.x, b.head.y);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.lineWidth = 1.5 * invZoom;
          ctx.setLineDash([3 * invZoom, 3 * invZoom]);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }
    }

    // 3. Render each bone body (Blender / Moho Octahedral Diamond shape)
    for (const b of bones) {
      const isSelected = b.id === selectedBoneId;
      const dx = b.tail.x - b.head.x;
      const dy = b.tail.y - b.head.y;
      const len = Math.max(1, Math.hypot(dx, dy));
      const nx = -dy / len;
      const ny = dx / len;

      const waistDist = len * 0.25;
      const waistX = b.head.x + (dx / len) * waistDist;
      const waistY = b.head.y + (dy / len) * waistDist;
      const halfWidth = Math.max(7 * invZoom, Math.min(22 * invZoom, len * 0.18));

      const wLeftX = waistX + nx * halfWidth;
      const wLeftY = waistY + ny * halfWidth;
      const wRightX = waistX - nx * halfWidth;
      const wRightY = waistY - ny * halfWidth;

      // Bone body diamond path
      ctx.beginPath();
      ctx.moveTo(b.head.x, b.head.y);
      ctx.lineTo(wLeftX, wLeftY);
      ctx.lineTo(b.tail.x, b.tail.y);
      ctx.lineTo(wRightX, wRightY);
      ctx.closePath();

      // Shadow / glow for selected bone
      if (isSelected) {
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 12 * invZoom;
      } else {
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
      }

      ctx.fillStyle = isSelected
        ? 'rgba(6, 182, 212, 0.65)'
        : 'rgba(30, 41, 59, 0.8)';
      ctx.fill();

      ctx.strokeStyle = isSelected ? '#ffffff' : b.color || '#38bdf8';
      ctx.lineWidth = (isSelected ? 2.5 : 1.8) * invZoom;
      ctx.stroke();

      ctx.shadowBlur = 0;

      // 4. Head joint circle (Base pivot)
      const headRadius = (isSelected ? 8 : 6.5) * invZoom;
      ctx.beginPath();
      ctx.arc(b.head.x, b.head.y, headRadius, 0, Math.PI * 2);
      ctx.fillStyle = isSelected ? '#ffffff' : b.color || '#38bdf8';
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.5 * invZoom;
      ctx.stroke();

      // Inner dot
      ctx.beginPath();
      ctx.arc(b.head.x, b.head.y, headRadius * 0.45, 0, Math.PI * 2);
      ctx.fillStyle = '#0f172a';
      ctx.fill();

      // 5. Tail joint circle (Tip handle)
      const tailRadius = (isSelected ? 6.5 : 5) * invZoom;
      ctx.beginPath();
      ctx.arc(b.tail.x, b.tail.y, tailRadius, 0, Math.PI * 2);
      ctx.fillStyle = isSelected ? '#38bdf8' : '#e2e8f0';
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.5 * invZoom;
      ctx.stroke();

      // 6. Bone Name Badge
      ctx.save();
      const badgeY = waistY - 14 * invZoom;
      const text = b.name;
      ctx.font = `bold ${Math.max(10, Math.round(11 * invZoom))}px Inter, sans-serif`;
      const textMetrics = ctx.measureText(text);
      const textWidth = textMetrics.width;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(
        waistX - textWidth / 2 - 4 * invZoom,
        badgeY - 9 * invZoom,
        textWidth + 8 * invZoom,
        14 * invZoom
      );
      ctx.strokeStyle = isSelected ? '#06b6d4' : 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1 * invZoom;
      ctx.strokeRect(
        waistX - textWidth / 2 - 4 * invZoom,
        badgeY - 9 * invZoom,
        textWidth + 8 * invZoom,
        14 * invZoom
      );

      ctx.fillStyle = isSelected ? '#38bdf8' : '#f8fafc';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, waistX, badgeY - 2 * invZoom);
      ctx.restore();
    }

    ctx.restore();
  }
}
