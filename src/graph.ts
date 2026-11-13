import type {Frame, Lesson} from './content/lessons';
import type {Method, View} from './model';
import type {Shape} from './content/reference';
export function nodeBounds(shape: Shape, view: View) {
  return shape === 'mux' && view === 'tfv'
    ? {halfWidth: 38, halfHeight: 48}
    : {halfWidth: 63, halfHeight: 31};
}
export function displayFrame(lesson: Lesson, index: number, method: Method): Frame {
  return lesson.frames[
    method === 'cycle' && lesson.cycleFrames ? lesson.cycleFrames[index] : index
  ];
}
export function pinSourceId(id: string) {
  const parts = id.split(':');
  return parts.length > 2 ? parts[2] : parts[0];
}
export function expandNode(visible: string[], id: string, edges: {from: string; to: string}[]) {
  return [...new Set([...visible, ...edges.filter(e => e.to === id).map(e => e.from)])];
}
export function retainSelection<T extends {type: string; id: string}>(
  selection: T,
  available: Set<string>,
  target: string,
): T | {type: 'node'; id: string} {
  return available.has(`${selection.type}:${selection.id}`)
    ? selection
    : {type: 'node', id: target};
}
export function fitBounds(
  bounds: {x: number; y: number; width: number; height: number},
  viewport = {width: 800, height: 430},
) {
  const zoom = Math.min(
    2,
    Math.max(1, viewport.width - 48) / Math.max(1, bounds.width),
    Math.max(1, viewport.height - 48) / Math.max(1, bounds.height),
  );
  return {
    zoom,
    pan: {
      x: (viewport.width / 2 - bounds.x - bounds.width / 2) * zoom,
      y: (viewport.height / 2 - bounds.y - bounds.height / 2) * zoom,
    },
  };
}
