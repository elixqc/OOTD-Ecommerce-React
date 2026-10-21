// CORE + U2 · UI — sets the document title per page.
// Rendered at the top of each route so the browser tab shows the current screen name.
// React 19 moves a <title> rendered anywhere in the tree into the document <head>,
// so react-helmet isn't needed.
export default function MetaData({ title }) {
    return <title>{title ? `${title} - OOTD` : 'OOTD'}</title>;
}
