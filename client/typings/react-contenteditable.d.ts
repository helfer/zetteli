declare module 'react-contenteditable' {
    interface Props extends React.Props<ContentEditable> {
        [property: string]: any
    }

    class ContentEditable extends React.Component<Props, never> {
        htmlEl: HTMLDivElement;
    }
    export = ContentEditable;
}