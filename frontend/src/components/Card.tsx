interface Props{

card:any;

disabled?:boolean;

onClick?:()=>void;

}

const suitColor={
 HEART:"text-red-600",
 DIAMOND:"text-red-600",
 CLUB:"text-black",
 SPADE:"text-black",
};

export default function Card({

card,

disabled,

onClick,

}:Props){

return(

<button

disabled={disabled}

onClick={onClick}

className={`

w-20
h-32

rounded-xl

bg-white

shadow-xl

border-2

flex

flex-col

justify-between

p-2

transition

${disabled
?"opacity-40"
:"hover:-translate-y-4"
}

`}

>

<div

className={`
font-bold
${suitColor[
card.suit as keyof typeof suitColor
] || ""
}
`}

>

{card.rank}

</div>

<div

className={`
text-3xl
self-center
${suitColor[
card.suit as keyof typeof suitColor
] || ""
}
`}

>

{symbol(card.suit)}

</div>

<div

className={`
self-end
font-bold
${suitColor[
card.suit as keyof typeof suitColor
] || ""
}
`}

>

{card.rank}

</div>

</button>

)

}

function symbol(
suit:string
){

switch(
suit
){

case "HEART":
return "♥";

case "DIAMOND":
return "♦";

case "SPADE":
return "♠";

case "CLUB":
return "♣";

default:
return suit;

}

}