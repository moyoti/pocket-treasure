import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Text, View, StyleSheet } from 'react-native';

// Simple test component
const TestComponent = ({ title }: { title: string }) => (
  <View>
    <Text testID="title-text">{title}</Text>
  </View>
);

describe('Test Infrastructure', () => {
  it('renders component correctly', () => {
    render(<TestComponent title="Hello World" />);
    expect(screen.getByTestId('title-text')).toBeTruthy();
    expect(screen.getByText('Hello World')).toBeTruthy();
  });

  it('matches snapshot', () => {
    const { toJSON } = render(<TestComponent title="Snapshot Test" />);
    expect(toJSON()).toMatchSnapshot();
  });
});
