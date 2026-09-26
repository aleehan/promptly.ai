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

    const time = new Date(timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
    });

    return (
        <div className="message" data-role={role}>
            <div className="message-bubble">
                <div className="message-bubble_content">
                    {status === 'pending' ? (
                        // <span className="message-loading-placeholder">Generating...</span>
                        <MatrixLoader variant={"scan"}/>
                    ) : role === 'assistant' ? (
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm, remarkMath]}
                            rehypePlugins={[rehypeKatex]}
                            components={markdownComponents}
                        >{text}
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