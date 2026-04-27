interface LoadingProps {
	isLoading: boolean,
	text?: string
	className?: string
}

export function ButtonLoading({ isLoading=false, text='Loading', className='' } : LoadingProps) {
  if (!isLoading) return null;
  
  return (
		<div className={`flex gap-2 items-center justify-center ${className}`}>
      <div className={`w-5 h-5 border-2 border-red-200 border-t-4 border-t-lime-300 rounded-full animate-spin`}></div>
			<span>{text}</span>
		</div>
  );
}

// const styles = {
// 	.loading-spinner: {
// 		display: flex;
// 		justify-content: center;
// 		align-items: center;
// 		position: absolute;
// 		top: 0;
// 		left: 0;
// 		right: 0;
// 		bottom: 0;
// 		background: rgba(255, 255, 255, 0.7);
// 	},
	
// 	.spinner: {
// 		border: 2px solid rgba(165, 145, 145, 0.763);
// 		border-top: 4px solid #c1f0e8;
// 		border-radius: 50%;
// 		/* width: 20px; */
// 		/* height: 20px; */
// 		animation: spin 1s linear infinite;
// 	},
	
// 	@keyframes spin: {
// 		0% { transform: rotate(0deg); }
// 		100% { transform: rotate(360deg); }
// 	}
// }
