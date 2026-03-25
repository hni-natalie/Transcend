import { UserChipItem } from "../types/user.types"

function generateSizeClasses(diameter : number) {
  return `w-${diameter} h-${diameter}`;
}

function ChipUser( {name, role, photo, expandStatus} : UserChipItem & {expandStatus : string} ) {
	// const diameter = generateSizeClasses(1)

	return (
		<div className='flex gap-x-4'>
			<div className={`w-10 h-10 rounded-full flex-shrink-0 overflow-hidden`}>
			<img
				src={photo}
        alt={`${name}'s profile`}
        className='w-full h-full object-cover'
				/>
			</div>
			{expandStatus === 'expanded' && (
			<div className='flex flex-col'>
				<p>{name}</p>
				<p className="text-xs text-brand-gray">{role}</p>
			</div>
			)}
		</div>
	)
}

export default ChipUser