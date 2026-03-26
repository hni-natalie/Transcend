import { MenuSide, FormAddUser } from '../components';
import { menuConfig } from '../config/menu.conf';

function DashboardPage () {
	return (
		<div className='bg-brand-black-sub h-screen'>

			<div className='flex h-full gap-x-0.5'>
				<MenuSide conf={menuConfig} />

				<div className='bg-brand-black w-full p-8'>
					<FormAddUser />
					{/* <h1>body container</h1> */}
				</div>

				<div className='p-8'>
					<h1>another container</h1>
				</div>
			</div>

		</div>
	)
}

export default DashboardPage;