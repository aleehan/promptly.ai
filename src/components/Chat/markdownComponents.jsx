import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

// this component for code markdown

const markdownComponents = {
    code({ node, inline, className, children, ...props }) {
        const match = /language-(\w+)/.exec(className || '');

        if (!inline && match) {
            return (
                <SyntaxHighlighter
                    style={oneDark}
                    language={match[1]}
                    PreTag="div"
                    customStyle={{ borderRadius: '12px', fontSize: '13px', margin: '12px 0', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    {...props}
                >
                    {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
            );
        }

        return (
            <code className={className} {...props}>
                {children}
            </code>
        );
    },
};

export default markdownComponents;