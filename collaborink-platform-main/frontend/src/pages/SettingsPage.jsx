import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Bell, Shield, Save, Loader, Check } from 'lucide-react';
import Layout from '../layouts/Layout';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

const TABS = [
  { id: 'profile',       label: 'Profile',       icon: User   },
  { id: 'notifications', label: 'Notifications', icon: Bell   },
  { id: 'security',      label: 'Security',      icon: Shield },
];

const TIMEZONES = [
  { value: 'UTC',                  label: 'UTC'          },
  { value: 'America/New_York',     label: 'Eastern (ET)' },
  { value: 'America/Chicago',      label: 'Central (CT)' },
  { value: 'America/Denver',       label: 'Mountain (MT)'},
  { value: 'America/Los_Angeles',  label: 'Pacific (PT)' },
  { value: 'Europe/London',        label: 'London (GMT)' },
  { value: 'Europe/Berlin',        label: 'Berlin (CET)' },
  { value: 'Asia/Karachi',         label: 'Karachi (PKT)'},
  { value: 'Asia/Kolkata',         label: 'India (IST)'  },
  { value: 'Asia/Tokyo',           label: 'Tokyo (JST)'  },
];

const PANEL_VARIANTS = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] } },
  exit:    { opacity: 0, y: -4, transition: { duration: 0.15 } },
};

export default function SettingsPage() {
  const { user, updateProfile } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving]       = useState(false);
  const [saved,  setSaved]        = useState(false);

  const [profile, setProfile] = useState({
    firstName: user?.firstName || '',
    lastName:  user?.lastName  || '',
    bio:       user?.bio       || '',
    phone:     user?.phone     || '',
    timezone:  user?.timezone  || 'UTC',
  });

  const [notifPrefs, setNotifPrefs] = useState({
    emailNotifications: user?.preferences?.emailNotifications ?? true,
  });

  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [pwError, setPwError]     = useState('');

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!profile.firstName.trim() || !profile.lastName.trim()) {
      toast.error('First and last name are required');
      return;
    }
    setSaving(true);
    try {
      await updateProfile({ ...profile, preferences: { ...user?.preferences, ...notifPrefs } });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      toast.success('Profile saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile({ preferences: { ...user?.preferences, ...notifPrefs } });
      toast.success('Preferences saved');
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwError('');
    if (passwords.next.length < 6)              { setPwError('Password must be at least 6 characters'); return; }
    if (passwords.next !== passwords.confirm)    { setPwError('Passwords do not match'); return; }
    setSaving(true);
    try {
      await updateProfile({ currentPassword: passwords.current, newPassword: passwords.next });
      setPasswords({ current: '', next: '', confirm: '' });
      toast.success('Password changed');
    } catch (err) {
      setPwError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const avatarInitials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase();

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-teal-400/75 mb-1">Account</p>
          <h1 className="text-[17px] font-semibold tracking-tight text-white">Settings</h1>
        </div>

        <div className="flex gap-6">
          {/* Sidebar nav */}
          <nav className="w-44 flex-shrink-0 space-y-0.5">
            {TABS.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left outline-none"
                  style={{ color: activeTab === tab.id ? '#5eead4' : '#64748b' }}
                >
                  {activeTab === tab.id && (
                    <motion.span
                      layoutId="settings-nav-bg"
                      className="absolute inset-0 rounded-xl pointer-events-none"
                      style={{
                        background: 'linear-gradient(135deg, rgba(45,212,191,.1) 0%, rgba(99,102,241,.06) 100%)',
                        border: '1px solid rgba(45,212,191,.18)',
                      }}
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    />
                  )}
                  <Icon size={15} className="relative" />
                  <span className="relative">{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Content card */}
          <div
            className="flex-1 rounded-2xl p-6 min-w-0"
            style={{
              background: 'rgba(7,11,22,.7)',
              border: '1px solid rgba(71,85,105,.3)',
              backdropFilter: 'blur(12px)',
            }}
          >
            <AnimatePresence mode="wait">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <motion.form
                  key="profile"
                  variants={PANEL_VARIANTS}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  onSubmit={handleSaveProfile}
                  className="space-y-5"
                >
                  <h2 className="text-[15px] font-semibold text-white mb-4">Profile Information</h2>

                  {/* Avatar */}
                  <div className="flex items-center gap-4 mb-6">
                    <span
                      className="grid h-14 w-14 place-items-center rounded-2xl text-lg font-bold overflow-hidden flex-shrink-0"
                      style={{
                        background: 'linear-gradient(135deg, #818cf8 0%, #2dd4bf 100%)',
                        color: '#042f2e',
                        boxShadow: '0 0 0 2px rgba(45,212,191,.2)',
                      }}
                    >
                      {user?.avatar
                        ? <img src={user.avatar} alt={avatarInitials} className="h-full w-full object-cover" />
                        : avatarInitials
                      }
                    </span>
                    <div>
                      <p className="text-sm font-medium text-slate-200">{user?.email}</p>
                      <p className="text-xs text-slate-500 mt-0.5 capitalize">
                        {user?.role} · {user?.status}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">First name *</label>
                      <input
                        value={profile.firstName}
                        onChange={e => setProfile(p => ({ ...p, firstName: e.target.value }))}
                        className="control w-full"
                      />
                    </div>
                    <div>
                      <label className="label">Last name *</label>
                      <input
                        value={profile.lastName}
                        onChange={e => setProfile(p => ({ ...p, lastName: e.target.value }))}
                        className="control w-full"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="label">Bio</label>
                    <textarea
                      value={profile.bio}
                      onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))}
                      placeholder="Tell your team a bit about yourself…"
                      rows={3}
                      className="control w-full resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Phone</label>
                      <input
                        value={profile.phone}
                        onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
                        placeholder="+1 (555) 000-0000"
                        className="control w-full"
                      />
                    </div>
                    <div>
                      <label className="label">Timezone</label>
                      <select
                        value={profile.timezone}
                        onChange={e => setProfile(p => ({ ...p, timezone: e.target.value }))}
                        className="control w-full"
                      >
                        {TIMEZONES.map(tz => (
                          <option key={tz.value} value={tz.value} className="bg-slate-900">
                            {tz.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="btn-primary flex items-center gap-2 disabled:opacity-40"
                    >
                      {saving
                        ? <Loader size={14} className="animate-spin" />
                        : saved
                          ? <Check size={14} />
                          : <Save size={14} />
                      }
                      {saved ? 'Saved!' : 'Save Changes'}
                    </button>
                  </div>
                </motion.form>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <motion.form
                  key="notifications"
                  variants={PANEL_VARIANTS}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  onSubmit={handleSaveNotifications}
                  className="space-y-5"
                >
                  <h2 className="text-[15px] font-semibold text-white mb-4">Notification Preferences</h2>

                  <div className="space-y-1">
                    <ToggleRow
                      label="Email notifications"
                      description="Receive email alerts for task assignments, mentions, and invites"
                      checked={notifPrefs.emailNotifications}
                      onChange={v => setNotifPrefs(p => ({ ...p, emailNotifications: v }))}
                    />
                  </div>

                  <div className="pt-4" style={{ borderTop: '1px solid rgba(71,85,105,.25)' }}>
                    <p className="text-xs text-slate-600 mb-4">
                      In-app notifications are always enabled and cannot be turned off.
                    </p>
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={saving}
                        className="btn-primary flex items-center gap-2 disabled:opacity-40"
                      >
                        {saving ? <Loader size={14} className="animate-spin" /> : <Save size={14} />}
                        Save Preferences
                      </button>
                    </div>
                  </div>
                </motion.form>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <motion.form
                  key="security"
                  variants={PANEL_VARIANTS}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  onSubmit={handleChangePassword}
                  className="space-y-5"
                >
                  <h2 className="text-[15px] font-semibold text-white mb-4">Change Password</h2>

                  <div>
                    <label className="label">Current password</label>
                    <input
                      type="password"
                      value={passwords.current}
                      onChange={e => setPasswords(p => ({ ...p, current: e.target.value }))}
                      className="control w-full"
                    />
                  </div>
                  <div>
                    <label className="label">New password</label>
                    <input
                      type="password"
                      value={passwords.next}
                      onChange={e => setPasswords(p => ({ ...p, next: e.target.value }))}
                      className="control w-full"
                    />
                  </div>
                  <div>
                    <label className="label">Confirm new password</label>
                    <input
                      type="password"
                      value={passwords.confirm}
                      onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))}
                      className="control w-full"
                    />
                  </div>

                  <AnimatePresence>
                    {pwError && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="text-sm text-rose-400"
                      >
                        {pwError}
                      </motion.p>
                    )}
                  </AnimatePresence>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={saving || !passwords.current || !passwords.next}
                      className="btn-primary flex items-center gap-2 disabled:opacity-40"
                    >
                      {saving ? <Loader size={14} className="animate-spin" /> : <Shield size={14} />}
                      Update Password
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function ToggleRow({ label, description, checked, onChange }) {
  return (
    <div
      className="flex items-center justify-between py-3"
      style={{ borderBottom: '1px solid rgba(71,85,105,.2)' }}
    >
      <div className="flex-1 pr-4">
        <p className="text-sm font-medium text-slate-200">{label}</p>
        {description && (
          <p className="text-xs text-slate-500 mt-0.5">{description}</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 outline-none"
        style={{ background: checked ? '#2dd4bf' : 'rgba(71,85,105,.5)' }}
        aria-pressed={checked}
      >
        <span
          className="inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform"
          style={{ transform: checked ? 'translateX(18px)' : 'translateX(2px)' }}
        />
      </button>
    </div>
  );
}
