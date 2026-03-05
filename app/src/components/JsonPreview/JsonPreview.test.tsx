import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { JsonPreview } from './index';
import { useFlowStore } from '../../store/flowStore';

Object.defineProperty(navigator, 'clipboard', {
  value: { writeText: vi.fn().mockResolvedValue(undefined) },
  writable: true,
});

describe('JsonPreview', () => {
  beforeEach(() => {
    useFlowStore.setState({
      nodes: [],
      edges: [],
      policyMeta: {
        id: 'test-id',
        name: 'Test Policy',
        description: '',
        version: '1.0.0',
        startAt: '',
      },
    });
  });

  it('renders a pre element', () => {
    const { container } = render(<JsonPreview />);
    expect(container.querySelector('pre')).toBeTruthy();
  });

  it('renders Copiar button', () => {
    render(<JsonPreview />);
    expect(screen.getByText('Copiar')).toBeTruthy();
  });

  it('calls clipboard.writeText when copy button is clicked', () => {
    render(<JsonPreview />);
    fireEvent.click(screen.getByText('Copiar'));
    expect(navigator.clipboard.writeText).toHaveBeenCalled();
  });

  it('re-renders JSON when store is updated', async () => {
    const { container } = render(<JsonPreview />);
    const pre = container.querySelector('pre')!;
    const initialHtml = pre.innerHTML;

    await act(async () => {
      useFlowStore.setState({
        policyMeta: {
          id: 'test-id',
          name: 'Updated Policy',
          description: '',
          version: '1.0.0',
          startAt: '',
        },
      });
    });

    expect(pre.innerHTML).not.toBe(initialHtml);
  });
});
