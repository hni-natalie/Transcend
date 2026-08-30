/* Full width alert banner */

type Props = {
	message: string;
	className?: string;
}

export const AlertBanner = ({ message, className } : Props) => {
	return (
		<div className={`mb-2 p-4 rounded-xl bg-background-2 text-accent-lime text-sm font-medium ${className}`}>
			{message}
		</div>
	)
}