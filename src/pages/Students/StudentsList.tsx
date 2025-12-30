import PageMeta from "../../components/common/PageMeta";

export default function StudentsList() {
    return (
        <>
            <PageMeta
                title="Students | BRS Academy"
                description="View and manage your students"
            />
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
                <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
                    Students List
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                    Your students will appear here.
                </p>
            </div>
        </>
    );
}
