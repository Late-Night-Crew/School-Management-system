import { useCallback, useState } from "react";

import { getDirectory } from "../../api/accounts";
import { ROLES, getSession } from "../../auth/session";
import { AddressLine, EmailLink, NoContact, PhoneLinks } from "../../components/ContactLinks";
import DataState from "../../components/DataState";
import TablePagination from "../../components/TablePagination";
import useAsync from "../../hooks/useAsync";
import usePagination from "../../hooks/usePagination";
import { Badge, Button, Card, Field, Page, SearchInput, Select, Table } from "../../components/ui";
import { EditRegionOfficeDialog, EditSchoolOfficeDialog } from "./OfficeDialogs";
import styles from "./Contacts.module.css";

const TABS = [
  { key: "offices", label: "Ministry & Divisions", icon: "bi-building" },
  { key: "schools", label: "Schools", icon: "bi-mortarboard" },
];

// How to reach the ministry, each division office and each school outside OSS.
// Personal numbers of school managers only show for their division and the ministry.
export default function ContactsPage() {
  const session = getSession();
  const { data, loading, error, reload } = useAsync(useCallback(() => getDirectory(), []));
  const [activeTab, setActiveTab] = useState("offices");
  const [editing, setEditing] = useState(null); // { kind: "region" | "school", entry }

  const ownRegionId =
    session.role === ROLES.REGIONAL_ADMIN
      ? Number(session.regionId)
      : data?.schools.find((s) => s.is_own)?.region_id;
  const ownSchool = data?.schools.find((s) => s.is_own);

  return (
    <Page
      icon="bi-person-lines-fill"
      title="Contacts"
      subtitle="Phone numbers, emails and addresses for the ministry, division offices and schools, for when a call is faster than a message."
      tabs={TABS}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      <DataState loading={loading && !data} error={error} onRetry={reload}>
        {data && activeTab === "offices" && (
          <>
            {ownSchool && (
              <SchoolCard school={ownSchool} title="Your school" onEdit={() => setEditing({ kind: "school", entry: ownSchool })} />
            )}
            <div className={styles.cards}>
              <MinistryCard people={data.ministry} />
              {[...data.regions]
                .sort((a, b) => (b.id === ownRegionId) - (a.id === ownRegionId))
                .map((region) => (
                  <RegionCard
                    key={region.id}
                    region={region}
                    isYours={region.id === ownRegionId}
                    onEdit={() => setEditing({ kind: "region", entry: region })}
                  />
                ))}
            </div>
          </>
        )}
        {data && activeTab === "schools" && (
          <SchoolDirectory
            schools={data.schools}
            regions={data.regions}
            defaultRegionId={session.role === ROLES.REGIONAL_ADMIN ? ownRegionId : ""}
            onEdit={(school) => setEditing({ kind: "school", entry: school })}
          />
        )}
      </DataState>

      {editing?.kind === "region" && (
        <EditRegionOfficeDialog
          region={editing.entry}
          onHide={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            reload();
          }}
        />
      )}
      {editing?.kind === "school" && (
        <EditSchoolOfficeDialog
          school={editing.entry}
          onHide={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            reload();
          }}
        />
      )}
    </Page>
  );
}

function MinistryCard({ people }) {
  return (
    <Card accent="purple" icon="bi-bank" title="Ministry Headquarters" subtitle="Learner Support Manager">
      {people.length === 0 && <NoContact />}
      {people.map((person) => (
        <Person key={person.id} person={person} />
      ))}
    </Card>
  );
}

function RegionCard({ region, isYours, onEdit }) {
  const { office, admin } = region;
  const hasOffice = office.phone || office.email || office.postal_address || office.physical_address;
  return (
    <Card
      accent={isYours ? "blue" : "slate"}
      icon="bi-geo-alt"
      title={`${region.name} Division`}
      subtitle={isYours ? "Your division" : "Division office"}
      actions={
        region.can_edit && (
          <Button variant="ghost" size="sm" icon="bi-pencil" onClick={onEdit}>
            Edit
          </Button>
        )
      }
    >
      <div className={styles.section}>Office</div>
      {hasOffice ? (
        <>
          <PhoneLinks phone={office.phone} />
          <EmailLink email={office.email} />
          <AddressLine>{office.postal_address}</AddressLine>
          <AddressLine icon="bi-pin-map">{office.physical_address}</AddressLine>
        </>
      ) : (
        <NoContact>No office details yet</NoContact>
      )}
      <div className={styles.section}>Regional admin</div>
      {admin ? <Person person={admin} /> : <NoContact>No regional admin assigned</NoContact>}
    </Card>
  );
}

function Person({ person }) {
  return (
    <div className={styles.person}>
      <div className={styles.personName}>{person.name}</div>
      <PhoneLinks phone={person.phone} whatsapp={person.whatsapp} />
      <EmailLink email={person.email} />
    </div>
  );
}

function SchoolCard({ school, title, onEdit }) {
  return (
    <Card
      accent="green"
      icon="bi-mortarboard"
      title={title}
      subtitle={`${school.name} · ${school.district_name}`}
      actions={
        school.can_edit && (
          <Button variant="ghost" size="sm" icon="bi-pencil" onClick={onEdit}>
            Edit
          </Button>
        )
      }
    >
      <div className="ui-grid ui-cols-3">
        <div>
          <div className={styles.section}>School office</div>
          <OfficeLines school={school} />
        </div>
        <div>
          <div className={styles.section}>Head teacher</div>
          <HeadTeacher school={school} />
        </div>
        <div>
          <div className={styles.section}>OSS users</div>
          <Managers managers={school.managers} />
        </div>
      </div>
    </Card>
  );
}

function OfficeLines({ school }) {
  const { office } = school;
  if (!office.phone && !office.email && !office.postal_address) return <NoContact>Not provided</NoContact>;
  return (
    <>
      <PhoneLinks phone={office.phone} />
      <EmailLink email={office.email} />
      <AddressLine>{office.postal_address}</AddressLine>
    </>
  );
}

function HeadTeacher({ school }) {
  if (!school.head_teacher_name && !school.head_teacher_phone) return <NoContact>Not provided</NoContact>;
  return (
    <>
      {school.head_teacher_name && <div className={styles.personName}>{school.head_teacher_name}</div>}
      <PhoneLinks phone={school.head_teacher_phone} />
    </>
  );
}

function Managers({ managers }) {
  if (managers.length === 0) return <NoContact>No active account</NoContact>;
  return managers.map((manager) => (
    <div key={manager.id} className={styles.person}>
      <div className={styles.personName}>{manager.name}</div>
      <PhoneLinks phone={manager.phone} whatsapp={manager.whatsapp} />
      <EmailLink email={manager.email} />
    </div>
  ));
}

function SchoolDirectory({ schools, regions, defaultRegionId, onEdit }) {
  const [search, setSearch] = useState("");
  const [regionId, setRegionId] = useState(defaultRegionId ? String(defaultRegionId) : "");
  const [districtId, setDistrictId] = useState("");

  const inRegion = schools.filter((s) => !regionId || s.region_id === Number(regionId));
  const districts = [...new Map(inRegion.map((s) => [s.district_id, s.district_name])).entries()].sort((a, b) =>
    a[1].localeCompare(b[1])
  );
  const term = search.trim().toLowerCase();
  const visible = inRegion.filter(
    (s) =>
      (!districtId || s.district_id === Number(districtId)) &&
      `${s.name} ${s.school_number} ${s.head_teacher_name || ""} ${s.managers.map((m) => m.name).join(" ")}`
        .toLowerCase()
        .includes(term)
  );
  const { page, pageCount, pageItems, setPage } = usePagination(visible, 25);

  return (
    <>
      <Card accent="slate" icon="bi-funnel" title="Find a school">
        <div className="ui-grid ui-cols-3">
          <Field label="Search">
            <SearchInput value={search} onChange={setSearch} placeholder="School, number, head teacher or user" />
          </Field>
          <Field label="Division">
            <Select
              value={regionId}
              onChange={(e) => {
                setRegionId(e.target.value);
                setDistrictId("");
              }}
            >
              <option value="">All divisions</option>
              {regions.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="District">
            <Select value={districtId} onChange={(e) => setDistrictId(e.target.value)}>
              <option value="">All districts</option>
              {districts.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </Card>

      <Card
        accent="green"
        icon="bi-mortarboard"
        title="Schools"
        subtitle={`${visible.length} school${visible.length === 1 ? "" : "s"}. Managers' personal numbers show only for their division and the ministry.`}
        flush
      >
        <DataState empty={visible.length === 0} emptyMessage="No schools match these filters.">
          <Table>
            <thead>
              <tr>
                <th>School</th>
                <th>School office</th>
                <th>Head teacher</th>
                <th>OSS users</th>
                <th className="end" aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {pageItems.map((school) => (
                <tr key={school.id}>
                  <td>
                    <div className="strong">
                      {school.name} {school.is_own && <Badge tone="blue">Yours</Badge>}
                    </div>
                    <div className={styles.muted}>
                      {school.school_number} · {school.district_name} · {school.region_name}
                    </div>
                  </td>
                  <td>
                    <OfficeLines school={school} />
                  </td>
                  <td>
                    <HeadTeacher school={school} />
                  </td>
                  <td>
                    <Managers managers={school.managers} />
                  </td>
                  <td className="end">
                    {school.can_edit && (
                      <Button variant="ghost" size="sm" icon="bi-pencil" onClick={() => onEdit(school)}>
                        Edit
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          <TablePagination page={page} pageCount={pageCount} onChange={setPage} />
        </DataState>
      </Card>
    </>
  );
}
