import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select';

afterEach(() => cleanup());

describe('Select', () => {
  it('renders the current value in an accessible combobox trigger', () => {
    render(
      <Select defaultValue="30">
        <SelectTrigger aria-label="Lưu lịch sử trong">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="7">7 ngày</SelectItem>
          <SelectItem value="30">30 ngày</SelectItem>
        </SelectContent>
      </Select>,
    );

    const trigger = screen.getByRole('combobox', { name: 'Lưu lịch sử trong' });
    expect(trigger).toHaveTextContent('30 ngày');
    expect(trigger).toHaveClass('h-11', 'rounded-xl');
  });
});
