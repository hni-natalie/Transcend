/*
	Empty card component for Task & Meetings to reuse
*/
type Props = {
	title: string;
	desc?: string;
}

export const EmptyCard = ({ title, desc } : Props) => {
	return (
		<div className="text-foreground-3 bg-surface-secondary rounded-xl p-8 min-h-[180px] flex flex-col items-center justify-center text-center">
			<p className="text-md font-medium">
				{title}
			</p>
			{desc &&
			<p className="text-sm text-text-tertiary mt-1">
				{desc}
			</p>}
		</div>
	);
}