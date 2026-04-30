import Sidebar from "../../components/Sidebar"
import {
	Breadcrumb,
	BreadcrumbList,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbSeparator,
	BreadcrumbPage,
} from "../../components/ui/Breadcrumb"

export default function Page() {
	return (
		<div className="flex bg-white min-h-screen">
			<main className="flex-1 p-8 bg-white">
					<Breadcrumb>
						<BreadcrumbList>
							<BreadcrumbItem>
								<BreadcrumbLink href="/">Home</BreadcrumbLink>
							</BreadcrumbItem>
							<BreadcrumbSeparator />
							{/* <BreadcrumbItem>
								<BreadcrumbLink href="/inventory_manager">Inventory Manager</BreadcrumbLink>
							</BreadcrumbItem> */}
							<BreadcrumbItem>
								<BreadcrumbPage>Dashboard</BreadcrumbPage>
							</BreadcrumbItem>
						</BreadcrumbList>
					</Breadcrumb>
				<h1 className="text-2xl font-semibold mb-4 text-slate-900">
					<span className="bg-gradient-to-r from-[#923FEF] to-[#C35DE8] bg-clip-text text-transparent">IICT</span>
					{" "}Inventory Manager
				</h1>
				<p className="text-slate-700">Welcome to the inventory manager dashboard. Select a section from the sidebar.</p>
			</main>
		</div>
	)
}
