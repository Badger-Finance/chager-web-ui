import { useMemo } from "react";

export interface AbbrTextOptions {
    text: string;
    front?: number;
    end?: number;
}
export function abbrText(options: AbbrTextOptions) {
    const front = options.front || 6;
    const end = options.end || 6;
    const maxLength = front + end;
    if (!options.text) return "";
    if (options.text.length > maxLength) {
        return `${options.text.slice(0, front)}...${options.text.slice(options.text.length - end, options.text.length)}`;
    } else {
        return options.text;
    }
}

export interface TextAbbrLabelProps extends AbbrTextOptions {
    text: string;
    front?: number;
    end?: number;
    className?: string;
    asText?: boolean;
}
export function TextAbbrLabel(props: TextAbbrLabelProps) {
    const text = useMemo(() => {
        return abbrText(props);
    }, [props]);
    return props.asText ? (text as any) : <div className={props.className}>{text}</div>;
}
