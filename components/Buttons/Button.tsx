import classNames from "classnames";
import React from "react";
import { FunctionComponent, ReactNode } from "react";

/**
 * ButtonProps is a React Component properties that passed to React Component Button
 */
type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    full?: boolean; // if full is true, then the button will have w-full class
    children: ReactNode;
    ref?: any;
};

/**
 * Button is just yet another react component
 *
 * @link https://fettblog.eu/typescript-react/components/#functional-components
 */

const Button: FunctionComponent<ButtonProps> = React.forwardRef((props: ButtonProps, ref: any) => {
    return (
        <button ref={ref} {...props} className={classNames([`button border border-[#E93BF8] bg-transparent py-[6px] px-[12px] text-sm font-semibold leading-4 tracking-[-0.02em] text-[#E93BF8] transition duration-300 ease-out ${props.full ? "w-full" : ""}`, props.className])}>
            {props.children}
        </button>
    );
});
Button.displayName = "Button";

export default Button;
