import { useCallback, useState } from "react";
import { useParams } from "react-router-dom";

import { getSchool } from "../../api/schools";
import { schoolPromotionBase } from "../../api/promotion";
import useAsync from "../../hooks/useAsync";
import ToastNote from "../../components/ToastNote";
import { Button, Page } from "../../components/ui";
import { ROLES, getSession } from "../../auth/session";
import YearEndPanel from "./YearEndPanel";

// One school's terms and year end: the coordinator's own school, or any school for
// MCDE (opened from the Promotion page).
export default function SchoolPromotion() {
  const { schoolId } = useParams();
  const isSuper = getSession().role === ROLES.SUPER_ADMIN;
  const school = useAsync(useCallback(() => getSchool(schoolId), [schoolId]));
  const [toast, setToast] = useState({ show: false, message: "", variant: "success" });
  const name = school.data?.name || "this school";

  return (
    <Page
      icon="bi-mortarboard"
      title={isSuper ? `Promotion: ${name}` : "Terms & Promotion"}
      subtitle="Move the school through Terms 1 to 3, then finish the year: learners who passed enough subjects in Term 3 move up."
      actions={
        isSuper && (
          <>
            <Button variant="ghost" icon="bi-pencil-square" to={`/admin/schools/${schoolId}/marks`}>
              Correct marks
            </Button>
            <Button variant="ghost" icon="bi-arrow-left" to="/admin/promotion">
              All schools
            </Button>
          </>
        )
      }
    >
      <ToastNote {...toast} onClose={() => setToast((t) => ({ ...t, show: false }))} />
      <YearEndPanel
        base={schoolPromotionBase(isSuper, schoolId)}
        schoolName={name}
        notify={(message) => setToast({ show: true, message, variant: "success" })}
      />
    </Page>
  );
}
