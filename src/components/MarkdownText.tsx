interface MarkdownTextProps {
  children: string;
}

const MarkdownText = ({ children }: MarkdownTextProps) => {
  // Simple markdown parser for basic formatting
  const parseMarkdown = (text: string) => {
    const parts: (string | JSX.Element)[] = [];
    let lastIndex = 0;
    let key = 0;

    // Match **bold** text
    const boldRegex = /\*\*(.+?)\*\*/g;
    let match;

    while ((match = boldRegex.exec(text)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      // Add bold text
      parts.push(
        <strong key={key++} className="font-semibold">
          {match[1]}
        </strong>
      );
      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  // Split by newlines and parse each line
  const lines = children.split('\n');
  
  return (
    <>
      {lines.map((line, index) => (
        <span key={index}>
          {parseMarkdown(line)}
          {index < lines.length - 1 && <br />}
        </span>
      ))}
    </>
  );
};

export default MarkdownText;
