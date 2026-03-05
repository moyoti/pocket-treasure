/**
 * @jest-environment jsdom
 */

describe('Test infrastructure', () => {
  it('should pass a basic test', () => {
    expect(true).toBe(true);
  });

  it('should support jest-dom matchers', () => {
    const div = document.createElement('div');
    div.className = 'active';
    div.textContent = 'Hello World';
    document.body.appendChild(div);

    expect(div).toBeInTheDocument();
    expect(div).toHaveClass('active');
    expect(div).toHaveTextContent('Hello World');

    document.body.removeChild(div);
  });

  it('should support async/await', async () => {
    const promise = Promise.resolve('resolved');
    await expect(promise).resolves.toBe('resolved');
  });
});
