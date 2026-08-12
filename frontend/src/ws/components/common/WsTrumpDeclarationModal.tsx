import { useDispatch } from "react-redux";
import TrumpDeclarationModal from "@/components/common/TrumpDeclarationModal";
import { setTrumpDeclaration } from "@/store/slices/wsGameSlice";
import { useModalA11y } from "@/ws/hooks/useModalA11y";

interface Props {
    suit: string | null;
}

export default function WsTrumpDeclarationModal({ suit }: Props) {
    const dispatch = useDispatch();
    const a11y = useModalA11y(
        !!suit,
        () => dispatch(setTrumpDeclaration(null))
    );

    if (!suit) {
        return null;
    }

    return (
        <div {...a11y}>
            <TrumpDeclarationModal suit={suit} />
        </div>
    );
}
