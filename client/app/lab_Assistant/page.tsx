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
		<div className="p-8 bg-white">
			<Breadcrumb>
				<BreadcrumbList>
					<BreadcrumbItem>
						<BreadcrumbLink href="/">Home</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbPage>Staff Dashboard</BreadcrumbPage>
					</BreadcrumbItem>
				</BreadcrumbList>
			</Breadcrumb>
			<h1 className="text-2xl font-semibold mb-4 text-slate-900 mt-6">
				<span className="bg-gradient-to-r from-[#923FEF] to-[#C35DE8] bg-clip-text text-transparent">IICT</span>
				{" "}Staff Dashboard
			</h1>
			<p className="text-slate-700">Welcome to the staff dashboard. Select a section from the sidebar.</p>
		</div>
	)
}
