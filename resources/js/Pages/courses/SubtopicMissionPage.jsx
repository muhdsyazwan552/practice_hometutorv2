import React from "react";
import { Head, router, usePage } from "@inertiajs/react";
import SubtopicMission from "@/Components/SubtopicMission";
import { resolveDashboardTheme } from "@/utils/dashboardTheme";

export default function SubtopicMissionPage() {
    const { subject, subject_id, level_id, topic_id, topic_name, back_url, session_id, studentTheme } = usePage().props;
    const palette = resolveDashboardTheme(studentTheme, studentTheme?.custom);

    return (
        <div className="min-h-screen" style={{ background: palette?.pageGradient || palette?.page || "#e0f2fe" }}>
            <Head title={topic_name} />
            <SubtopicMission
                asPage
                isOpen
                onClose={() => router.visit(back_url)}
                subjectId={subject_id}
                levelId={level_id}
                subjectKey={subject}
                topicId={topic_id}
                topicName={topic_name}
                initialSessionId={session_id}
            />
        </div>
    );
}
