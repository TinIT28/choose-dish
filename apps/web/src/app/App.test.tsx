import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from './App';

describe('App', () => {
  it('welcomes the user to the daily dish picker', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: 'Chọn món hôm nay' })).toBeInTheDocument();
  });
});
