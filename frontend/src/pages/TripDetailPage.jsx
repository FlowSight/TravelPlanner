import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  CardHeader,
  Button,
  Text,
  Input,
  Textarea,
  Field,
  Badge,
  Spinner,
  Tab,
  TabList,
  Divider,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Dropdown,
  Option,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import {
  ArrowLeft24Regular,
  Add24Regular,
  Save24Regular,
  Delete24Regular,
  Document24Regular,
  Calendar24Regular,
  People24Regular,
  NoteAdd24Regular,
} from '@fluentui/react-icons';
import { getTrip, updateTrip, addTripMember, removeTripMember, searchUsers } from '../services/api';
import { useAuth } from '../context/AuthContext';

const useStyles = makeStyles({
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px',
    gap: '16px',
    flexWrap: 'wrap',
  },
  section: {
    marginTop: '24px',
  },
  dayCard: {
    marginBottom: '16px',
    padding: '16px',
  },
  activityRow: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start',
    padding: '8px 0',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  docCard: {
    padding: '12px',
    marginBottom: '8px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  memberRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
});

export default function TripDetailPage() {
  const styles = useStyles();
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('itinerary');
  const [saving, setSaving] = useState(false);

  // Itinerary editing
  const [editingNotes, setEditingNotes] = useState('');

  // New day dialog
  const [dayDialogOpen, setDayDialogOpen] = useState(false);
  const [newDay, setNewDay] = useState({ dayNumber: 1, theme: '', date: '' });

  // New activity dialog
  const [activityDialogOpen, setActivityDialogOpen] = useState(false);
  const [activityDayIndex, setActivityDayIndex] = useState(0);
  const [newActivity, setNewActivity] = useState({ time: '', placeName: '', description: '', notes: '' });

  // New document dialog
  const [docDialogOpen, setDocDialogOpen] = useState(false);
  const [newDoc, setNewDoc] = useState({ title: '', url: '', type: 'other', notes: '' });

  // Add member dialog
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [memberResults, setMemberResults] = useState([]);

  useEffect(() => {
    fetchTrip();
  }, [id]);

  useEffect(() => {
    if (trip) setEditingNotes(trip.notes || '');
  }, [trip]);

  const fetchTrip = async () => {
    setLoading(true);
    try {
      const res = await getTrip(id);
      setTrip(res.data.trip);
    } catch (err) {
      console.error('Failed to fetch trip:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveTrip = async (updates) => {
    setSaving(true);
    try {
      const res = await updateTrip(id, updates);
      setTrip(res.data.trip);
    } catch (err) {
      console.error('Failed to save:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleAddDay = async () => {
    const itinerary = [...(trip.itinerary || []), newDay];
    await saveTrip({ itinerary });
    setDayDialogOpen(false);
    setNewDay({ dayNumber: (trip.itinerary?.length || 0) + 2, theme: '', date: '' });
  };

  const handleDeleteDay = async (dayIndex) => {
    if (!window.confirm('Delete this day?')) return;
    const itinerary = trip.itinerary.filter((_, i) => i !== dayIndex);
    await saveTrip({ itinerary });
  };

  const handleAddActivity = async () => {
    const itinerary = [...trip.itinerary];
    if (!itinerary[activityDayIndex].activities) {
      itinerary[activityDayIndex].activities = [];
    }
    itinerary[activityDayIndex].activities.push(newActivity);
    await saveTrip({ itinerary });
    setActivityDialogOpen(false);
    setNewActivity({ time: '', placeName: '', description: '', notes: '' });
  };

  const handleDeleteActivity = async (dayIndex, actIndex) => {
    const itinerary = [...trip.itinerary];
    itinerary[dayIndex].activities.splice(actIndex, 1);
    await saveTrip({ itinerary });
  };

  const handleSaveNotes = async () => {
    await saveTrip({ notes: editingNotes });
  };

  const handleAddDoc = async () => {
    const documents = [...(trip.documents || []), newDoc];
    await saveTrip({ documents });
    setDocDialogOpen(false);
    setNewDoc({ title: '', url: '', type: 'other', notes: '' });
  };

  const handleDeleteDoc = async (docIndex) => {
    const documents = trip.documents.filter((_, i) => i !== docIndex);
    await saveTrip({ documents });
  };

  const handleSearchMembers = async (q) => {
    setMemberSearch(q);
    if (q.length >= 2) {
      try {
        const res = await searchUsers(q);
        setMemberResults(res.data.users);
      } catch (err) {
        console.error(err);
      }
    } else {
      setMemberResults([]);
    }
  };

  const handleAddMember = async (userId) => {
    try {
      await addTripMember(id, { userId, role: 'editor' });
      fetchTrip();
      setMemberDialogOpen(false);
      setMemberSearch('');
      setMemberResults([]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Remove this member?')) return;
    try {
      await removeTripMember(id, userId);
      fetchTrip();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 100 }}>
        <Spinner size="large" label="Loading trip..." />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="page-container">
        <Text>Trip not found or access denied.</Text>
      </div>
    );
  }

  const isOwner = trip.owner?._id === user?.id;
  const canEdit = isOwner || trip.members?.some((m) => m.user?._id === user?.id && m.role === 'editor');

  return (
    <div className="page-container">
      {/* Header */}
      <div className={styles.header}>
        <div>
          <Button icon={<ArrowLeft24Regular />} appearance="subtle" onClick={() => navigate('/trips')}>
            Back
          </Button>
          <Text size={700} weight="bold" block style={{ marginTop: 8 }}>
            {trip.title}
          </Text>
          <Text size={300} style={{ color: tokens.colorNeutralForeground3 }}>
            {trip.destination || 'No destination'} &middot;{' '}
            <Calendar24Regular style={{ verticalAlign: 'middle' }} />{' '}
            {trip.startDate ? new Date(trip.startDate).toLocaleDateString() : '—'} —{' '}
            {trip.endDate ? new Date(trip.endDate).toLocaleDateString() : '—'}
          </Text>
          <div style={{ marginTop: 8 }}>
            <Badge appearance="tint" color="brand" style={{ textTransform: 'capitalize' }}>
              {trip.status}
            </Badge>
          </div>
        </div>
        {saving && <Spinner size="tiny" label="Saving..." />}
      </div>

      {/* Tabs */}
      <TabList selectedValue={activeTab} onTabSelect={(e, data) => setActiveTab(data.value)}>
        <Tab value="itinerary">Itinerary</Tab>
        <Tab value="notes">Notes</Tab>
        <Tab value="documents">Documents</Tab>
        <Tab value="members">Members</Tab>
      </TabList>

      <Divider style={{ marginTop: 8 }} />

      {/* Itinerary Tab */}
      {activeTab === 'itinerary' && (
        <div className={styles.section}>
          {canEdit && (
            <Dialog open={dayDialogOpen} onOpenChange={(e, data) => setDayDialogOpen(data.open)}>
              <DialogTrigger disableButtonEnhancement>
                <Button icon={<Add24Regular />} appearance="primary" style={{ marginBottom: 16 }}>
                  Add Day
                </Button>
              </DialogTrigger>
              <DialogSurface>
                <DialogBody>
                  <DialogTitle>Add Day to Itinerary</DialogTitle>
                  <DialogContent>
                    <div className={styles.form}>
                      <Field label="Day Number">
                        <Input
                          type="number"
                          value={String(newDay.dayNumber)}
                          onChange={(e, data) => setNewDay((p) => ({ ...p, dayNumber: parseInt(data.value) || 1 }))}
                        />
                      </Field>
                      <Field label="Theme">
                        <Input
                          value={newDay.theme}
                          onChange={(e, data) => setNewDay((p) => ({ ...p, theme: data.value }))}
                          placeholder="e.g. Temples & the River"
                        />
                      </Field>
                      <Field label="Date">
                        <Input
                          type="date"
                          value={newDay.date}
                          onChange={(e, data) => setNewDay((p) => ({ ...p, date: data.value }))}
                        />
                      </Field>
                    </div>
                  </DialogContent>
                  <DialogActions>
                    <DialogTrigger disableButtonEnhancement>
                      <Button appearance="secondary">Cancel</Button>
                    </DialogTrigger>
                    <Button appearance="primary" onClick={handleAddDay}>Add</Button>
                  </DialogActions>
                </DialogBody>
              </DialogSurface>
            </Dialog>
          )}

          {(!trip.itinerary || trip.itinerary.length === 0) ? (
            <Text>No days in the itinerary yet.</Text>
          ) : (
            trip.itinerary
              .sort((a, b) => a.dayNumber - b.dayNumber)
              .map((day, dayIndex) => (
                <Card key={dayIndex} className={styles.dayCard}>
                  <CardHeader
                    header={
                      <Text weight="semibold" size={500}>
                        Day {day.dayNumber}{day.theme ? ` — ${day.theme}` : ''}
                      </Text>
                    }
                    description={day.date ? new Date(day.date).toLocaleDateString() : ''}
                    action={
                      canEdit && (
                        <div style={{ display: 'flex', gap: 4 }}>
                          <Button
                            icon={<Add24Regular />}
                            size="small"
                            appearance="subtle"
                            onClick={() => {
                              setActivityDayIndex(dayIndex);
                              setActivityDialogOpen(true);
                            }}
                          >
                            Activity
                          </Button>
                          <Button
                            icon={<Delete24Regular />}
                            size="small"
                            appearance="subtle"
                            onClick={() => handleDeleteDay(dayIndex)}
                          />
                        </div>
                      )
                    }
                  />
                  {day.activities && day.activities.length > 0 ? (
                    day.activities.map((act, actIndex) => (
                      <div key={actIndex} className={styles.activityRow}>
                        <Text weight="semibold" size={200} style={{ minWidth: 80 }}>
                          {act.time || '—'}
                        </Text>
                        <div style={{ flex: 1 }}>
                          <Text weight="semibold">{act.placeName || 'Untitled'}</Text>
                          {act.description && <Text size={200} block>{act.description}</Text>}
                          {act.notes && (
                            <Text size={200} block style={{ color: tokens.colorNeutralForeground3 }}>
                              {act.notes}
                            </Text>
                          )}
                        </div>
                        {canEdit && (
                          <Button
                            icon={<Delete24Regular />}
                            size="small"
                            appearance="subtle"
                            onClick={() => handleDeleteActivity(dayIndex, actIndex)}
                          />
                        )}
                      </div>
                    ))
                  ) : (
                    <Text size={200} style={{ padding: '8px 0', color: tokens.colorNeutralForeground3 }}>
                      No activities yet
                    </Text>
                  )}
                </Card>
              ))
          )}

          {/* Add Activity Dialog */}
          <Dialog open={activityDialogOpen} onOpenChange={(e, data) => setActivityDialogOpen(data.open)}>
            <DialogSurface>
              <DialogBody>
                <DialogTitle>Add Activity</DialogTitle>
                <DialogContent>
                  <div className={styles.form}>
                    <Field label="Time">
                      <Input
                        value={newActivity.time}
                        onChange={(e, data) => setNewActivity((p) => ({ ...p, time: data.value }))}
                        placeholder="e.g. 9:00 AM"
                      />
                    </Field>
                    <Field label="Place Name">
                      <Input
                        value={newActivity.placeName}
                        onChange={(e, data) => setNewActivity((p) => ({ ...p, placeName: data.value }))}
                        placeholder="e.g. Wat Phra Kaew"
                      />
                    </Field>
                    <Field label="Description">
                      <Textarea
                        value={newActivity.description}
                        onChange={(e, data) => setNewActivity((p) => ({ ...p, description: data.value }))}
                        placeholder="What will you do here?"
                      />
                    </Field>
                    <Field label="Notes">
                      <Input
                        value={newActivity.notes}
                        onChange={(e, data) => setNewActivity((p) => ({ ...p, notes: data.value }))}
                        placeholder="Any tips or reminders"
                      />
                    </Field>
                  </div>
                </DialogContent>
                <DialogActions>
                  <DialogTrigger disableButtonEnhancement>
                    <Button appearance="secondary">Cancel</Button>
                  </DialogTrigger>
                  <Button appearance="primary" onClick={handleAddActivity}>Add</Button>
                </DialogActions>
              </DialogBody>
            </DialogSurface>
          </Dialog>
        </div>
      )}

      {/* Notes Tab */}
      {activeTab === 'notes' && (
        <div className={styles.section}>
          <Field label="Trip Notes">
            <Textarea
              value={editingNotes}
              onChange={(e, data) => setEditingNotes(data.value)}
              rows={12}
              disabled={!canEdit}
              placeholder="Add general notes about the trip..."
              style={{ width: '100%' }}
            />
          </Field>
          {canEdit && (
            <Button
              appearance="primary"
              icon={<Save24Regular />}
              onClick={handleSaveNotes}
              style={{ marginTop: 12 }}
              disabled={saving}
            >
              Save Notes
            </Button>
          )}
        </div>
      )}

      {/* Documents Tab */}
      {activeTab === 'documents' && (
        <div className={styles.section}>
          {canEdit && (
            <Dialog open={docDialogOpen} onOpenChange={(e, data) => setDocDialogOpen(data.open)}>
              <DialogTrigger disableButtonEnhancement>
                <Button icon={<Add24Regular />} appearance="primary" style={{ marginBottom: 16 }}>
                  Add Document
                </Button>
              </DialogTrigger>
              <DialogSurface>
                <DialogBody>
                  <DialogTitle>Add Document Link</DialogTitle>
                  <DialogContent>
                    <div className={styles.form}>
                      <Field label="Title" required>
                        <Input
                          value={newDoc.title}
                          onChange={(e, data) => setNewDoc((p) => ({ ...p, title: data.value }))}
                          placeholder="e.g. Flight Booking"
                        />
                      </Field>
                      <Field label="URL" required>
                        <Input
                          value={newDoc.url}
                          onChange={(e, data) => setNewDoc((p) => ({ ...p, url: data.value }))}
                          placeholder="https://..."
                        />
                      </Field>
                      <Field label="Type">
                        <Dropdown
                          value={newDoc.type}
                          onOptionSelect={(e, data) => setNewDoc((p) => ({ ...p, type: data.optionValue }))}
                        >
                          {['flight', 'hotel', 'visa', 'insurance', 'ticket', 'other'].map((t) => (
                            <Option key={t} value={t}>
                              {t.charAt(0).toUpperCase() + t.slice(1)}
                            </Option>
                          ))}
                        </Dropdown>
                      </Field>
                      <Field label="Notes">
                        <Input
                          value={newDoc.notes}
                          onChange={(e, data) => setNewDoc((p) => ({ ...p, notes: data.value }))}
                          placeholder="Any notes"
                        />
                      </Field>
                    </div>
                  </DialogContent>
                  <DialogActions>
                    <DialogTrigger disableButtonEnhancement>
                      <Button appearance="secondary">Cancel</Button>
                    </DialogTrigger>
                    <Button appearance="primary" onClick={handleAddDoc} disabled={!newDoc.title || !newDoc.url}>
                      Add
                    </Button>
                  </DialogActions>
                </DialogBody>
              </DialogSurface>
            </Dialog>
          )}

          {(!trip.documents || trip.documents.length === 0) ? (
            <Text>No documents attached yet.</Text>
          ) : (
            trip.documents.map((doc, i) => (
              <Card key={i} className={styles.docCard}>
                <div>
                  <Document24Regular style={{ verticalAlign: 'middle', marginRight: 8 }} />
                  <a href={doc.url} target="_blank" rel="noopener noreferrer">
                    <Text weight="semibold">{doc.title}</Text>
                  </a>
                  <Badge appearance="tint" style={{ marginLeft: 8, textTransform: 'capitalize' }}>
                    {doc.type}
                  </Badge>
                  {doc.notes && (
                    <Text size={200} block style={{ marginTop: 4, color: tokens.colorNeutralForeground3 }}>
                      {doc.notes}
                    </Text>
                  )}
                </div>
                {canEdit && (
                  <Button
                    icon={<Delete24Regular />}
                    size="small"
                    appearance="subtle"
                    onClick={() => handleDeleteDoc(i)}
                  />
                )}
              </Card>
            ))
          )}
        </div>
      )}

      {/* Members Tab */}
      {activeTab === 'members' && (
        <div className={styles.section}>
          {isOwner && (
            <Dialog open={memberDialogOpen} onOpenChange={(e, data) => setMemberDialogOpen(data.open)}>
              <DialogTrigger disableButtonEnhancement>
                <Button icon={<People24Regular />} appearance="primary" style={{ marginBottom: 16 }}>
                  Add Member
                </Button>
              </DialogTrigger>
              <DialogSurface>
                <DialogBody>
                  <DialogTitle>Add Trip Member</DialogTitle>
                  <DialogContent>
                    <Field label="Search by name or email">
                      <Input
                        value={memberSearch}
                        onChange={(e, data) => handleSearchMembers(data.value)}
                        placeholder="Type at least 2 characters..."
                      />
                    </Field>
                    <div style={{ marginTop: 12, maxHeight: 200, overflow: 'auto' }}>
                      {memberResults.map((u) => (
                        <div key={u._id} className={styles.memberRow}>
                          <Text>{u.name} ({u.email || u.phone})</Text>
                          <Button size="small" appearance="primary" onClick={() => handleAddMember(u._id)}>
                            Add
                          </Button>
                        </div>
                      ))}
                    </div>
                  </DialogContent>
                  <DialogActions>
                    <DialogTrigger disableButtonEnhancement>
                      <Button appearance="secondary">Close</Button>
                    </DialogTrigger>
                  </DialogActions>
                </DialogBody>
              </DialogSurface>
            </Dialog>
          )}

          <Card style={{ padding: 16 }}>
            <Text weight="semibold" block style={{ marginBottom: 12 }}>
              Trip Members
            </Text>
            {/* Owner */}
            <div className={styles.memberRow}>
              <Text>{trip.owner?.name} ({trip.owner?.email})</Text>
              <Badge appearance="tint" color="success">Owner</Badge>
            </div>
            {/* Members */}
            {trip.members?.map((m) => (
              <div key={m.user?._id} className={styles.memberRow}>
                <Text>{m.user?.name} ({m.user?.email})</Text>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Badge appearance="tint" style={{ textTransform: 'capitalize' }}>{m.role}</Badge>
                  {isOwner && (
                    <Button
                      icon={<Delete24Regular />}
                      size="small"
                      appearance="subtle"
                      onClick={() => handleRemoveMember(m.user?._id)}
                    />
                  )}
                </div>
              </div>
            ))}
          </Card>
        </div>
      )}
    </div>
  );
}
