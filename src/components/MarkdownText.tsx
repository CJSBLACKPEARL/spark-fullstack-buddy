import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownTextProps {
  children: string;
}

const MarkdownText = ({ children }: MarkdownTextProps) => {
  return (
    <div className="prose prose-sm max-w-none dark:prose-invert 
      prose-headings:font-bold prose-headings:tracking-tight
      prose-h1:text-lg prose-h2:text-base prose-h3:text-sm
      prose-h1:mt-4 prose-h1:mb-2 prose-h2:mt-3 prose-h2:mb-1.5 prose-h3:mt-2 prose-h3:mb-1
      prose-p:my-1.5 prose-p:leading-relaxed
      prose-ul:my-1.5 prose-ol:my-1.5
      prose-li:my-0.5
      prose-strong:font-bold prose-strong:text-foreground
      prose-table:my-3 prose-table:border prose-table:border-border prose-table:rounded-lg prose-table:overflow-hidden
      prose-thead:bg-muted/60
      prose-th:px-3 prose-th:py-2 prose-th:text-left prose-th:font-semibold prose-th:text-foreground prose-th:text-xs prose-th:uppercase prose-th:tracking-wider prose-th:border-b prose-th:border-border
      prose-td:px-3 prose-td:py-2 prose-td:border-b prose-td:border-border/50 prose-td:text-sm
      prose-tr:even:bg-muted/20
      prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:font-mono
      prose-pre:bg-muted prose-pre:rounded-lg prose-pre:p-3
      prose-blockquote:border-l-primary prose-blockquote:bg-primary/5 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-lg
      prose-a:text-primary prose-a:no-underline hover:prose-a:underline
    ">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  );
};

export default MarkdownText;
