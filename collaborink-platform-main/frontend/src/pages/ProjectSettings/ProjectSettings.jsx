import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

export default function ProjectSettings() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('member');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProjectSettings();
  }, [projectId]);

  const fetchProjectSettings = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(
        `http://localhost:3000/api/projects/${projectId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setProject(response.data);
      setMembers(response.data.members || []);
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to load project');
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!newMemberEmail.trim()) {
      setError('Please enter an email');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(
        `http://localhost:3000/api/projects/${projectId}/members`,
        {
          email: newMemberEmail,
          role: newMemberRole,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setMembers(response.data.members || []);
      setNewMemberEmail('');
      setNewMemberRole('member');
      alert('✅ Member added successfully!');
    } catch (err) {
      console.error('Error:', err);
      setError(err.response?.data?.message || 'Failed to add member');
      alert('❌ ' + (err.response?.data?.message || 'Failed to add member'));
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm('Are you sure you want to remove this member?')) return;

    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.delete(
        `http://localhost:3000/api/projects/${projectId}/members/${memberId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setMembers(response.data.members || []);
      alert('✅ Member removed');
    } catch (err) {
      console.error('Error:', err);
      alert('❌ Failed to remove member');
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button onClick={() => navigate(-1)} style={styles.backButton}>
          ← Back
        </button>
        <h1 style={styles.title}>Project Settings</h1>
      </div>

      {/* Project Info */}
      {project && (
        <div style={styles.section}>
          <h2 style={styles.projectName}>{project.name}</h2>
          <p style={styles.projectDesc}>{project.description}</p>
          <p style={styles.projectStatus}>
            Status: <strong>{project.status || 'Active'}</strong>
          </p>
        </div>
      )}

      {/* Members Section */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>
          👥 Members ({members.length})
        </h3>

        {/* Add Member Form */}
        <form onSubmit={handleAddMember} style={styles.form}>
          <div style={styles.formGroup}>
            <input
              type="email"
              placeholder="Enter member email"
              value={newMemberEmail}
              onChange={(e) => setNewMemberEmail(e.target.value)}
              style={styles.input}
            />
            <select
              value={newMemberRole}
              onChange={(e) => setNewMemberRole(e.target.value)}
              style={styles.select}
            >
              <option value="viewer">Viewer</option>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.button,
                opacity: loading ? 0.6 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? '⏳ Adding...' : '➕ Add Member'}
            </button>
          </div>
          {error && <p style={styles.error}>{error}</p>}
        </form>

        {/* Members List */}
        <div style={styles.membersList}>
          {members.length === 0 ? (
            <p style={styles.noMembers}>No members yet</p>
          ) : (
            members.map((member) => (
              <div key={member._id} style={styles.memberCard}>
                <div style={styles.memberInfo}>
                  <div style={styles.memberAvatar}>
                    {member.user?.firstName?.charAt(0) || '?'}
                  </div>
                  <div>
                    <p style={styles.memberName}>
                      {member.user?.firstName} {member.user?.lastName}
                    </p>
                    <p style={styles.memberEmail}>{member.user?.email}</p>
                    <p style={styles.memberRole}>
                      Role: <strong>{member.role}</strong>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveMember(member._id)}
                  style={styles.removeButton}
                >
                  🗑️ Remove
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '30px',
    maxWidth: '900px',
    margin: '0 auto',
    backgroundColor: '#1a1a2e',
    minHeight: '100vh',
    color: '#fff',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    marginBottom: '30px',
    borderBottom: '2px solid #4285F4',
    paddingBottom: '20px',
  },
  backButton: {
    padding: '10px 20px',
    backgroundColor: '#2a2a3e',
    color: '#fff',
    border: '1px solid #444',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '16px',
    transition: 'all 0.3s',
  },
  title: {
    margin: 0,
    fontSize: '28px',
    fontWeight: 'bold',
  },
  section: {
    backgroundColor: '#252540',
    padding: '25px',
    borderRadius: '10px',
    marginBottom: '25px',
    border: '1px solid #3a3a50',
  },
  projectName: {
    margin: '0 0 10px 0',
    fontSize: '22px',
    color: '#4285F4',
  },
  projectDesc: {
    margin: '5px 0',
    color: '#aaa',
    fontSize: '14px',
  },
  projectStatus: {
    margin: '10px 0 0 0',
    color: '#4285F4',
    fontSize: '14px',
  },
  sectionTitle: {
    margin: '0 0 20px 0',
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#fff',
  },
  form: {
    marginBottom: '25px',
    padding: '20px',
    backgroundColor: '#1a1a2e',
    borderRadius: '8px',
    border: '1px solid #3a3a50',
  },
  formGroup: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
    marginBottom: '10px',
  },
  input: {
    flex: 1,
    minWidth: '200px',
    padding: '12px',
    backgroundColor: '#2a2a3e',
    color: '#fff',
    border: '1px solid #444',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none',
  },
  select: {
    padding: '12px',
    backgroundColor: '#2a2a3e',
    color: '#fff',
    border: '1px solid #444',
    borderRadius: '6px',
    fontSize: '14px',
    cursor: 'pointer',
    outline: 'none',
  },
  button: {
    padding: '12px 20px',
    backgroundColor: '#4285F4',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    transition: 'all 0.3s',
  },
  error: {
    color: '#ff6b6b',
    fontSize: '12px',
    margin: '10px 0 0 0',
  },
  membersList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  noMembers: {
    textAlign: 'center',
    color: '#aaa',
    padding: '20px',
  },
  memberCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px',
    backgroundColor: '#1a1a2e',
    borderRadius: '8px',
    border: '1px solid #3a3a50',
    transition: 'all 0.3s',
  },
  memberInfo: {
    display: 'flex',
    gap: '15px',
    alignItems: 'center',
    flex: 1,
  },
  memberAvatar: {
    width: '45px',
    height: '45px',
    borderRadius: '50%',
    backgroundColor: '#4285F4',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '18px',
  },
  memberName: {
    margin: '0 0 5px 0',
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#fff',
  },
  memberEmail: {
    margin: '0 0 5px 0',
    fontSize: '12px',
    color: '#aaa',
  },
  memberRole: {
    margin: 0,
    fontSize: '12px',
    color: '#4285F4',
  },
  removeButton: {
    padding: '8px 15px',
    backgroundColor: '#ff4444',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '12px',
    transition: 'all 0.3s',
  },
};