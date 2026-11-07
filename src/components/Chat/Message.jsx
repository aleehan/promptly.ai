import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import MatrixLoader from "../MatrixLoader/MatrixLoader.jsx";
import markdownComponents from "./markdownComponents.jsx";

const Message = (props) => {
    const {
        role,
        text,
        timestamp,
        status,
    } = props;

    const isError = status === 'error';

    const time = new Date(timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
    });

    return (
        <div
            className={`message ${isError ? 'message--error' : ''}`}
            data-role={role}
        >
            <div className="message-bubble">
                <div className="message-bubble_content">
                    {status === 'pending' ? (
                        <MatrixLoader variant={"scan"}/>
                    ) : isError ? (
                        <div className="message-error">
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
                                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
                                <path d="M12 7v6M12 16.5v.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                            <span>{text}</span>
                        </div>
                    ) : role === 'assistant' ? (
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm, remarkMath]}
                            rehypePlugins={[rehypeKatex]}
                            components={markdownComponents}
                        >
                            {text}
                        </ReactMarkdown>
                    ) : (
                        text
                    )}
                </div>
            </div>
            {role === 'user' && (
                <span className="message-bubble_timestamp">{time}</span>
            )}
        </div>
    )
}

export default Message