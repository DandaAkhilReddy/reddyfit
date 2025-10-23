import { describe, it, expect } from 'vitest';
import { fileToBase64, renderMarkdown } from '../helpers';

describe('helpers', () => {
  describe('fileToBase64', () => {
    it('should convert a file to base64 string', async () => {
      const mockFile = new Blob(['test content'], { type: 'image/png' });
      const file = new File([mockFile], 'test.png', { type: 'image/png' });
      
      const result = await fileToBase64(file);
      
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    it('should handle blob conversion', async () => {
      const mockBlob = new Blob(['test content'], { type: 'image/jpeg' });
      
      const result = await fileToBase64(mockBlob);
      
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });
  });

  describe('renderMarkdown', () => {
    it('should return empty string for null input', () => {
      expect(renderMarkdown(null)).toBe('');
      expect(renderMarkdown(undefined)).toBe('');
    });

    it('should convert headers to HTML', () => {
      const markdown = '### Test Header';
      const result = renderMarkdown(markdown);
      
      expect(result).toContain('<h3');
      expect(result).toContain('Test Header');
      expect(result).toContain('text-amber-400');
    });

    it('should convert bold text', () => {
      const markdown = 'This is **bold** text';
      const result = renderMarkdown(markdown);
      
      expect(result).toContain('<strong>bold</strong>');
    });

    it('should convert lists to HTML', () => {
      const markdown = '- Item 1\n- Item 2\n- Item 3';
      const result = renderMarkdown(markdown);
      
      expect(result).toContain('<ul>');
      expect(result).toContain('<li>Item 1</li>');
      expect(result).toContain('<li>Item 2</li>');
      expect(result).toContain('</ul>');
    });

    it('should handle mixed markdown content', () => {
      const markdown = '### Equipment\n\n- **Dumbbells**\n- Barbell\n\nGood form is important.';
      const result = renderMarkdown(markdown);
      
      expect(result).toContain('<h3');
      expect(result).toContain('<ul>');
      expect(result).toContain('<strong>Dumbbells</strong>');
    });
  });
});
