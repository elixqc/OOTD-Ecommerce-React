// React 19 moves a <title> rendered anywhere in the tree into the document <head>,
// so react-helmet isn't needed.
export default function MetaData({ title }) {
    return <title>{title ? `${title} - OOTD` : 'OOTD'}</title>;
}
