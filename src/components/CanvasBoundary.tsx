import { Component, type ReactNode } from 'react';

type BoundaryProps = { children: ReactNode; fallback: ReactNode };
type BoundaryState = { failed: boolean };

/**
 * Keeps the site alive even if the WebGL scene fails to initialise
 * (GPU limits, context loss, driver quirks): the page keeps rendering
 * and a styled fallback stands in for the 3D film.
 */
export class CanvasBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { failed: false };
  static getDerivedStateFromError(): BoundaryState {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    console.error('[Dayrah] The 3D scene failed to render; showing the fallback frame instead.', error);
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
