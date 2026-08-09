import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "react-hot-toast";
import api from "../api/axios";
import useAuth from "../context/useAuth";

function Expense() {
  const { user } = useAuth();
  const location = useLocation();
  
  const [groups, setGroups] = useState([]);
  const [group, setGroup] = useState(null);
  const [groupName, setGroupName] = useState("");
  const [members, setMembers] = useState("");
  
  // Join group by code state
  const [inviteCodeInput, setInviteCodeInput] = useState("");

  // Dynamic add member email state
  const [newMemberEmail, setNewMemberEmail] = useState("");
  
  // Expense fields
  const [amount, setAmount] = useState("");
  const [expenseDesc, setExpenseDesc] = useState("");
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [payer, setPayer] = useState("");
  
  const [balances, setBalances] = useState(null);
  const [settlements, setSettlements] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);

  // Settle active payment dialog state
  const [activeSettle, setActiveSettle] = useState(null);

  // Load user's groups on component mount
  const loadGroups = async () => {
    try {
      const res = await api.get("/expense/groups");
      setGroups(res.data.groups || []);
      return res.data.groups || [];
    } catch (err) {
      console.error("Failed to load groups:", err);
      toast.error("Failed to retrieve groups");
      return [];
    }
  };

  useEffect(() => {
    const initData = async () => {
      const loadedGroups = await loadGroups();
      
      // Auto-join from query link if present
      const queryParams = new URLSearchParams(location.search);
      const joinCode = queryParams.get("join");
      if (joinCode) {
        handleJoinCodeSubmit(joinCode);
      } else if (loadedGroups.length > 0 && !group) {
        setGroup(loadedGroups[0]);
      }
    };
    initData();
  }, [location.search]);

  // Sync state if redirected from order confirmation with checkout total
  useEffect(() => {
    if (location.state?.amount) {
      setAmount(location.state.amount.toString());
      setExpenseDesc("CloudCart Order Split");
      toast.success(`Order amount ₹${location.state.amount} ready to split!`);
    }
  }, [location.state]);

  // Handle active group selection changes
  useEffect(() => {
    if (group) {
      loadBalances(group._id);
      loadExpenses(group._id);
      
      // Initialize participant checkboxes and payer selection
      if (group.members) {
        setSelectedParticipants(group.members.map(m => m.email));
        setPayer(user?.email || "");
      }
    } else {
      setBalances(null);
      setSettlements([]);
      setExpenses([]);
      setSelectedParticipants([]);
      setPayer("");
    }
  }, [group, user]);

  const splitEmails = (value) =>
    value.split(",").map(v => v.trim().toLowerCase()).filter(Boolean);

  const withLoading = async (fn) => {
    try {
      setLoading(true);
      await fn();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  /* CREATE GROUP */
  const createGroup = () =>
    withLoading(async () => {
      const emails = splitEmails(members);
      if (!groupName) {
        toast.error("Please enter a group name");
        return;
      }
      const res = await api.post("/expense/group", {
        name: groupName,
        members: emails
      });
      
      const newGroup = res.data.group;
      setGroups(prev => [newGroup, ...prev]);
      setGroup(newGroup);
      setGroupName("");
      setMembers("");
      toast.success("Expense group initialized!");
    });

  /* JOIN GROUP BY CODE */
  const handleJoinCodeSubmit = (codeToJoin) => {
    const code = codeToJoin || inviteCodeInput;
    if (!code) {
      toast.error("Please enter an invite code");
      return;
    }

    withLoading(async () => {
      const res = await api.post("/expense/group/join", { inviteCode: code });
      toast.success(res.data.message || "Joined group!");
      
      const loadedGroups = await loadGroups();
      const targetGroup = res.data.group || loadedGroups.find(g => g.inviteCode === code.trim().toUpperCase());
      if (targetGroup) {
        setGroup(targetGroup);
      }
      setInviteCodeInput("");

      // Clean query parameter from URL if present
      if (new URLSearchParams(window.location.search).get("join")) {
        window.history.replaceState({}, document.title, "/expense");
      }
    });
  };

  /* DYNAMIC ADD MEMBER */
  const handleAddMemberSubmit = (e) => {
    e.preventDefault();
    if (!newMemberEmail.trim()) return;

    withLoading(async () => {
      const res = await api.post("/expense/group/add-member", {
        groupId: group._id,
        email: newMemberEmail.trim()
      });
      
      const updatedGroup = res.data.group;
      setGroup(updatedGroup);
      setGroups(prev => prev.map(g => g._id === group._id ? updatedGroup : g));
      setNewMemberEmail("");
      toast.success("Member added to group!");
    });
  };

  /* ADD EXPENSE */
  const addExpense = () =>
    withLoading(async () => {
      if (!group) {
        toast.error("Please select or create a group first");
        return;
      }
      if (!amount) {
        toast.error("Please enter an amount");
        return;
      }
      if (selectedParticipants.length === 0) {
        toast.error("Select at least one participant to split with");
        return;
      }
      await api.post("/expense/add", {
        groupId: group._id,
        amount: Number(amount),
        participants: selectedParticipants,
        description: expenseDesc || "Group expense",
        paidBy: payer
      });
      
      setAmount("");
      setExpenseDesc("");
      toast.success("Expense added successfully!");
      
      // Reload details
      loadBalances(group._id);
      loadExpenses(group._id);
    });

  /* LOAD BALANCES & SETTLEMENTS */
  const loadBalances = async (groupId) => {
    if (!groupId) return;
    try {
      const res = await api.get(`/expense/balance/${groupId}`);
      setBalances(res.data.balance);
      setSettlements(res.data.settlements || []);
    } catch (err) {
      console.error("Error loading balances:", err);
    }
  };

  /* LOAD INDIVIDUAL EXPENSES LEDGER */
  const loadExpenses = async (groupId) => {
    if (!groupId) return;
    try {
      const res = await api.get(`/expense/group/${groupId}`);
      setExpenses(res.data.expenses || []);
    } catch (err) {
      console.error("Error loading ledger:", err);
    }
  };

  // Toggle participants checklist
  const handleToggleParticipant = (email) => {
    if (selectedParticipants.includes(email)) {
      setSelectedParticipants(prev => prev.filter(e => e !== email));
    } else {
      setSelectedParticipants(prev => [...prev, email]);
    }
  };

  // Select/Deselect all participants helper
  const handleToggleAllParticipants = () => {
    if (!group?.members) return;
    if (selectedParticipants.length === group.members.length) {
      setSelectedParticipants([]);
    } else {
      setSelectedParticipants(group.members.map(m => m.email));
    }
  };

  /* DEBT SETTLEMENT PAYMENTS (RAZORPAY & OFFLINE) */
  const settleDebt = (settle, method) => {
    setActiveSettle(null); // Close payment options dialog

    if (method === "OFFLINE") {
      withLoading(async () => {
        await api.post("/expense/add", {
          groupId: group._id,
          amount: settle.amount,
          participants: [settle.to], // split offset only with the creditor
          description: `Settled Debt to ${settle.toName || settle.to} (Offline)`,
          paidBy: settle.from // paid by the debtor (current user)
        });
        toast.success(`Debt of ₹${settle.amount} marked settled offline!`);
        loadBalances(group._id);
        loadExpenses(group._id);
      });
    } else if (method === "ONLINE") {
      withLoading(async () => {
        try {
          const orderRes = await api.post("/payment/create", { amount: settle.amount });
          const options = {
            key: import.meta.env.VITE_RAZORPAY_KEY_ID,
            amount: orderRes.data.amount,
            currency: "INR",
            name: "CloudCart Split",
            description: `Settle debt to ${settle.toName || settle.to}`,
            order_id: orderRes.data.id,
            handler: async (response) => {
              try {
                setLoading(true);
                const verifyRes = await api.post("/payment/verify", response);
                if (verifyRes.data.success) {
                  // Log offset transaction
                  await api.post("/expense/add", {
                    groupId: group._id,
                    amount: settle.amount,
                    participants: [settle.to],
                    description: `Settled Debt to ${settle.toName || settle.to} (via Razorpay)`,
                    paidBy: settle.from
                  });
                  toast.success(`Payment verified! Debt of ₹${settle.amount} settled.`);
                  loadBalances(group._id);
                  loadExpenses(group._id);
                } else {
                  toast.error("Payment verification failed");
                }
              } catch (err) {
                console.error("Verification error:", err);
                toast.error("Failed to verify settlement payment");
              } finally {
                setLoading(false);
              }
            }
          };
          const rzp = new window.Razorpay(options);
          rzp.open();
        } catch (err) {
          console.error("Razorpay setup error:", err);
          toast.error("Payment initialization failed");
        }
      });
    }
  };

  const copyJoinLink = () => {
    if (!group?.inviteCode) return;
    const link = `${window.location.origin}/expense?join=${group.inviteCode}`;
    navigator.clipboard.writeText(link);
    toast.success("Shareable Join Link copied to clipboard!");
  };

  /* CALCULATE CURRENT USER'S ACTUAL INDIVIDUAL BALANCE */
  let personalBalance = 0;
  if (balances && user?.email) {
    personalBalance = balances[user.email] || 0;
  }
  const owesYou = personalBalance > 0 ? personalBalance : 0;
  const youOwe = personalBalance < 0 ? Math.abs(personalBalance) : 0;

  return (
    <div className="max-w-[1440px] mx-auto px-4 md:px-[48px] py-10 grid grid-cols-1 lg:grid-cols-12 gap-8 font-sans">
      
      {/* ── Left Sidebar: Group Selection & Creation ── */}
      <aside className="lg:col-span-4 space-y-6">
        
        {/* Welcome Card (Personalized Balance Calculation) */}
        <section className="glass-card rounded-xl p-6 premium-shadow border border-outline-variant/30">
          <h1 className="font-display text-2xl font-bold text-on-surface mb-1">
            Welcome, {user?.name?.split(" ")[0] || "User"}
          </h1>
          <p className="text-sm text-on-surface-variant mb-6">Here is your personal overview in the active group.</p>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-100 flex flex-col justify-between">
              <span className="text-xs text-emerald-700 font-bold uppercase tracking-wider mb-2 block">You Are Owed</span>
              <span className="text-2xl font-display font-bold text-emerald-800">₹{owesYou.toFixed(2)}</span>
            </div>
            <div className="p-4 rounded-lg bg-red-50 border border-red-100 flex flex-col justify-between">
              <span className="text-xs text-red-700 font-bold uppercase tracking-wider mb-2 block">You Owe</span>
              <span className="text-2xl font-display font-bold text-red-800">₹{youOwe.toFixed(2)}</span>
            </div>
          </div>

          {balances && personalBalance === 0 && (
            <div className="mt-4 p-3 bg-surface-container-low rounded-lg text-center text-xs text-on-surface-variant font-medium">
              🎉 You are fully settled up in this group!
            </div>
          )}
        </section>

        {/* Group Selector & Manager */}
        <section className="bg-white border border-outline-variant/50 rounded-xl p-6 premium-shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-bold">Select Active Group</h2>
            <span className="material-symbols-outlined text-primary bg-primary-container/10 p-2 rounded-lg">diversity_3</span>
          </div>

          <div className="space-y-4">
            <div>
              <select
                value={group?._id || ""}
                onChange={(e) => {
                  const selected = groups.find(g => g._id === e.target.value);
                  setGroup(selected || null);
                }}
                className="w-full rounded-lg border border-outline-variant/50 bg-white px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all cursor-pointer font-medium"
              >
                <option value="">-- Choose Group --</option>
                {groups.map((g) => (
                  <option key={g._id} value={g._id}>
                    {g.name} ({g.members?.length || 0} members)
                  </option>
                ))}
              </select>
            </div>

            {group && (
              <div className="p-4 bg-surface-container-low/60 rounded-lg space-y-3 border border-outline-variant/10 text-xs">
                
                {/* Invite Code & Share Link */}
                {group.inviteCode && (
                  <div className="pb-3 border-b border-outline-variant/20 space-y-2">
                    <p className="font-bold text-on-surface flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm text-primary">share</span> Share Group Invite
                    </p>
                    <div className="flex gap-2 items-center">
                      <span className="bg-primary-fixed/20 text-primary px-3 py-1.5 rounded-lg font-mono font-bold tracking-wider text-center text-xs flex-grow border border-primary/20">
                        {group.inviteCode}
                      </span>
                      <button
                        onClick={copyJoinLink}
                        className="p-1.5 bg-primary hover:bg-primary-container text-white rounded-lg flex items-center justify-center cursor-pointer transition-colors shadow-sm"
                        title="Copy share link"
                      >
                        <span className="material-symbols-outlined text-base">content_copy</span>
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <p className="font-bold text-on-surface flex items-center justify-between">
                    <span>Members ({group.members?.length || 0})</span>
                  </p>
                  
                  {/* Inline Add Member Form */}
                  <form onSubmit={handleAddMemberSubmit} className="flex gap-2">
                    <input
                      type="email"
                      value={newMemberEmail}
                      onChange={(e) => setNewMemberEmail(e.target.value)}
                      placeholder="Add member email..."
                      className="flex-grow px-2.5 py-1.5 text-[11px] bg-white border border-outline-variant/60 rounded focus:outline-none focus:border-primary"
                    />
                    <button
                      type="submit"
                      disabled={loading || !newMemberEmail.trim()}
                      className="px-2.5 py-1.5 bg-primary hover:bg-primary-container text-white text-[11px] rounded font-bold transition-colors disabled:opacity-40 cursor-pointer"
                    >
                      Add
                    </button>
                  </form>

                  <ul className="space-y-1 text-on-surface-variant max-h-32 overflow-y-auto pr-1 pt-1.5">
                    {group.members?.map(m => (
                      <li key={m._id} className="flex justify-between items-center py-0.5 border-b border-outline-variant/10 last:border-none">
                        <span className="truncate max-w-[150px]">{m.name || m.email}</span>
                        <span className="text-[9px] text-primary bg-primary-fixed/20 px-1.5 py-0.5 rounded font-mono shrink-0">
                          {m.email === user?.email ? "You" : m.email.split("@")[0]}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

              </div>
            )}
          </div>
        </section>

        {/* Group Join & Creation Tabs */}
        <section className="bg-white border border-outline-variant/50 rounded-xl p-6 premium-shadow space-y-5">
          
          {/* Create Group */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-base font-bold">Create New Group</h2>
              <span className="material-symbols-outlined text-primary bg-primary-container/10 p-1.5 rounded-lg text-lg">group_add</span>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1 block">Group Name</label>
                <input 
                  className="w-full rounded-lg border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary px-3 py-1.5 text-xs outline-none transition-all"
                  placeholder="e.g. Vacation Cabin"
                  value={groupName}
                  onChange={e => setGroupName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1 block">Invites (emails, comma-separated)</label>
                <textarea 
                  className="w-full rounded-lg border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary px-3 py-1.5 text-xs outline-none transition-all resize-none font-mono"
                  placeholder="e.g. friend1@mail.com, friend2@mail.com"
                  rows="2"
                  value={members}
                  onChange={e => setMembers(e.target.value)}
                />
              </div>
              <button 
                onClick={createGroup}
                disabled={loading || !groupName}
                className="w-full py-2 bg-primary text-on-primary rounded-lg font-bold hover:bg-primary-container transition-all active:scale-[0.98] disabled:opacity-50 text-xs cursor-pointer"
              >
                {loading ? "Creating..." : "Create Group"}
              </button>
            </div>
          </div>

          <div className="h-px bg-outline-variant/30" />

          {/* Join Group via Code */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-base font-bold">Join Group by Code</h2>
              <span className="material-symbols-outlined text-primary bg-primary-container/10 p-1.5 rounded-lg text-lg">vpn_key</span>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1 block">Invite Code</label>
                <input 
                  className="w-full rounded-lg border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary px-3 py-1.5 text-xs outline-none transition-all font-mono uppercase text-center"
                  placeholder="e.g. A4D1F3"
                  value={inviteCodeInput}
                  onChange={e => setInviteCodeInput(e.target.value)}
                />
              </div>
              <button 
                onClick={() => handleJoinCodeSubmit()}
                disabled={loading || !inviteCodeInput.trim()}
                className="w-full py-2 bg-secondary text-white rounded-lg font-bold hover:bg-secondary-container transition-all active:scale-[0.98] disabled:opacity-50 text-xs cursor-pointer"
              >
                {loading ? "Joining..." : "Join Group"}
              </button>
            </div>
          </div>

        </section>

      </aside>

      {/* ── Main Content: Expense Logging, Settlements & Timeline ── */}
      <div className="lg:col-span-8 space-y-8">
        
        {/* Bento Quick Expense Form (Custom Payer & Checked Members) */}
        <section className="bg-white border border-outline-variant/50 rounded-2xl p-6 md:p-8 premium-shadow relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32"></div>
          
          <div className="mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="font-display text-xl font-bold">Add Group Expense</h2>
                <p className="text-xs text-on-surface-variant mt-1">Split a bill instantly with members.</p>
              </div>
              {group && (
                <button 
                  onClick={() => {
                    loadBalances(group._id);
                    loadExpenses(group._id);
                    toast.success("Data reloaded");
                  }}
                  className="flex items-center gap-1.5 text-xs font-bold text-primary hover:bg-primary-container/10 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px] animate-spin-hover">sync</span> Sync Ledger
                </button>
              )}
            </div>
          </div>

          {!group ? (
            <div className="py-12 text-center text-sm text-on-surface-variant font-medium border border-dashed border-outline-variant/50 rounded-xl bg-surface-container-low/30">
              <span className="material-symbols-outlined text-4xl text-outline-variant/40 mb-2 block">group_off</span>
              Please select or create an active group to log expenses.
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Form Input fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Amount</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant font-bold">₹</span>
                    <input 
                      className="w-full rounded-xl border border-outline-variant/50 pl-8 pr-4 py-2.5 text-base font-bold focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      placeholder="0.00"
                      type="number"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Description</label>
                  <input 
                    className="w-full rounded-xl border border-outline-variant/50 px-4 py-2.5 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    placeholder="e.g. Taxi back to hotel, Grocery run"
                    type="text"
                    value={expenseDesc}
                    onChange={e => setExpenseDesc(e.target.value)}
                  />
                </div>

              </div>

              {/* Advanced Controls: Payer & Split checklists */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-surface-container-low/50 rounded-xl border border-outline-variant/20">
                
                {/* 1. Who Paid */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Who Paid?</label>
                  <select
                    value={payer}
                    onChange={(e) => setPayer(e.target.value)}
                    className="w-full rounded-lg border border-outline-variant/50 bg-white px-3 py-2 text-xs focus:border-primary focus:ring-1 focus:ring-primary outline-none cursor-pointer font-medium"
                  >
                    {group.members?.map(m => (
                      <option key={m._id} value={m.email}>
                        {m.name || m.email} {m.email === user?.email ? "(You)" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Split Participants Checklist */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Split With Whom?</label>
                    <button
                      type="button"
                      onClick={handleToggleAllParticipants}
                      className="text-[10px] text-primary font-bold hover:underline cursor-pointer"
                    >
                      {selectedParticipants.length === group.members?.length ? "Clear All" : "Select All"}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                    {group.members?.map(m => {
                      const isChecked = selectedParticipants.includes(m.email);
                      return (
                        <label 
                          key={m._id} 
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs cursor-pointer transition-all ${
                            isChecked 
                              ? "bg-primary-fixed/10 border-primary/30 font-semibold text-primary" 
                              : "bg-white border-outline-variant/40 hover:bg-surface-container-low"
                          }`}
                        >
                          <input 
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleParticipant(m.email)}
                            className="w-3.5 h-3.5 accent-primary cursor-pointer"
                          />
                          <span className="truncate">{m.name || m.email}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Action Button */}
              <div className="flex justify-end pt-2 border-t border-outline-variant/20">
                <button 
                  onClick={addExpense}
                  disabled={loading || !amount || selectedParticipants.length === 0}
                  className="px-6 py-2.5 rounded-xl bg-primary text-on-primary font-bold hover:bg-primary-container transition-all shadow-md active:scale-95 disabled:opacity-40 disabled:pointer-events-none text-sm cursor-pointer"
                >
                  {loading ? "Posting..." : "Log Expense"}
                </button>
              </div>

            </div>
          )}
        </section>

        {/* Smart Debt Settlements instructions & Balances */}
        {group && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* settlements plan */}
            <section className="space-y-4">
              <h3 className="font-display text-lg font-bold px-1 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[22px]">swap_horiz</span>
                Settlement Strategy
              </h3>

              <div className="space-y-3">
                {settlements.length === 0 ? (
                  <div className="p-6 bg-emerald-50/50 border border-dashed border-emerald-200 rounded-xl text-center">
                    <span className="material-symbols-outlined text-emerald-600 text-3xl mb-1 block">task_alt</span>
                    <p className="text-xs text-emerald-800 font-semibold">Everyone is completely settled up!</p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                    {settlements.map((settle, idx) => {
                      const isFromYou = settle.from === user?.email;
                      const isToYou = settle.to === user?.email;
                      
                      return (
                        <div 
                          key={idx} 
                          className={`flex items-center justify-between p-3.5 rounded-xl border text-xs shadow-sm ${
                            isFromYou 
                              ? "bg-red-50/60 border-red-200 text-red-900" 
                              : isToYou 
                              ? "bg-emerald-50/60 border-emerald-200 text-emerald-950"
                              : "bg-white border-outline-variant/30 text-on-surface"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className={`material-symbols-outlined text-lg ${
                              isFromYou ? "text-red-600" : isToYou ? "text-emerald-600" : "text-primary"
                            }`}>
                              {isFromYou ? "trending_flat" : "payments"}
                            </span>
                            <div>
                              <p className="font-semibold">
                                {isFromYou ? <strong>You</strong> : settle.fromName} ➔ {isToYou ? <strong>You</strong> : settle.toName}
                              </p>
                              <p className="text-[10px] text-on-surface-variant/80 mt-0.5">
                                {settle.from.split("@")[0]} transfers to {settle.to.split("@")[0]}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="font-display font-extrabold text-sm text-right">
                              ₹{settle.amount.toFixed(2)}
                            </span>
                            {isFromYou && (
                              <button
                                onClick={() => setActiveSettle(settle)}
                                className="px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold shadow-sm cursor-pointer transition-all duration-200 active:scale-95 text-[10px]"
                              >
                                Settle Up
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>

            {/* Standings balances */}
            <section className="space-y-4">
              <h3 className="font-display text-lg font-bold px-1 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[22px]">account_balance_wallet</span>
                Member Standings
              </h3>

              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {balances && Object.keys(balances).length > 0 ? (
                  Object.entries(balances).map(([email, value], idx) => {
                    const isPositive = value > 0;
                    const isNeutral = value === 0;
                    const isCurrentUser = email === user?.email;
                    
                    const memberName = group.members?.find(m => m.email === email)?.name || email;

                    return (
                      <div 
                        key={idx} 
                        className={`flex items-center justify-between p-3 bg-white border rounded-xl transition-all ${
                          isCurrentUser ? "border-primary bg-primary-fixed/5 font-semibold" : "border-outline-variant/40"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center font-bold text-xs">
                            {memberName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-on-surface truncate max-w-[150px]">
                              {memberName} {isCurrentUser ? "(You)" : ""}
                            </h4>
                            <p className="text-[9px] text-on-surface-variant truncate max-w-[150px]">{email}</p>
                          </div>
                        </div>
                        
                        <div className={`text-right px-2.5 py-1.5 rounded-lg border text-[10px] ${
                          isNeutral ? "bg-surface-container-low border-outline-variant/20 text-on-surface-variant" : 
                          isPositive ? "bg-emerald-50 border-emerald-100 text-emerald-800" : 
                          "bg-red-50 border-red-100 text-red-800"
                        }`}>
                          <p className="font-bold">
                            {isNeutral ? "Settled" : isPositive ? "Owed +₹" + value.toFixed(2) : "Owes -₹" + Math.abs(value).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-on-surface-variant text-center py-6">No balances computed.</p>
                )}
              </div>
            </section>

          </div>
        )}

        {/* Expense History Timeline Ledger */}
        {group && (
          <section className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="font-display text-xl font-semibold">Expense Ledger</h2>
              <span className="text-xs text-on-surface-variant font-bold">{expenses.length} logs</span>
            </div>

            <div className="space-y-3">
              {expenses.length === 0 ? (
                <div className="p-8 bg-white border border-outline-variant/30 rounded-xl text-center">
                  <span className="material-symbols-outlined text-4xl text-outline-variant/30 mb-2 block">receipt_long</span>
                  <p className="text-sm font-semibold">No expenses recorded yet.</p>
                  <p className="text-xs text-on-surface-variant mt-1">Add items above to see transactions here.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
                  {expenses.map((exp, idx) => {
                    const isPayerCurrentUser = exp.paidBy?.email === user?.email;
                    const dateStr = new Date(exp.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "2-digit"
                    });
                    
                    return (
                      <div 
                        key={idx} 
                        className="flex items-start justify-between p-4 bg-white border border-outline-variant/40 rounded-xl hover:shadow-md transition-all gap-4"
                      >
                        <div className="flex items-start gap-3.5">
                          <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary flex-shrink-0 mt-0.5">
                            <span className="material-symbols-outlined text-lg">receipt</span>
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-on-surface">{exp.description || "Group Expense"}</h4>
                            <p className="text-xs text-on-surface-variant mt-1 leading-normal">
                              Paid by <strong className="text-on-surface">{isPayerCurrentUser ? "You" : exp.paidBy?.name || exp.paidBy?.email}</strong>
                            </p>
                            <p className="text-[10px] text-on-surface-variant/70 mt-1">
                              Split with {exp.participants?.length} people • {dateStr}
                            </p>
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <span className="font-display font-black text-base text-on-surface block">
                            ₹{exp.amount.toFixed(2)}
                          </span>
                          {isPayerCurrentUser ? (
                            <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded mt-1 inline-block">
                              You paid
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold text-on-surface-variant/80 bg-surface-container px-1.5 py-0.5 rounded mt-1 inline-block">
                              Split
                            </span>
                          )}
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        )}

      </div>

      {/* ── SETTLEMENT PAYMENT DIALOG DIALOG OVERLAY ── */}
      {activeSettle && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-outline-variant/20 space-y-4">
            <div className="flex items-center gap-3 text-primary">
              <span className="material-symbols-outlined text-3xl">payments</span>
              <h3 className="font-display font-bold text-lg">Settle Group Debt</h3>
            </div>
            
            <p className="text-sm text-on-surface-variant leading-relaxed">
              You are settling your debt of <strong className="text-on-surface font-extrabold">₹{activeSettle.amount.toFixed(2)}</strong> to <strong className="text-on-surface font-semibold">{activeSettle.toName || activeSettle.to}</strong>.
            </p>

            <div className="flex flex-col gap-2.5 pt-2">
              <button
                onClick={() => settleDebt(activeSettle, "ONLINE")}
                className="w-full py-3 bg-gradient-to-r from-primary to-secondary text-white font-bold rounded-xl hover:shadow-md hover:scale-[1.01] active:scale-95 transition-all cursor-pointer text-xs"
              >
                Pay Online (Razorpay) 💳
              </button>
              <button
                onClick={() => settleDebt(activeSettle, "OFFLINE")}
                className="w-full py-3 border border-outline-variant hover:bg-surface-container text-on-surface font-bold rounded-xl active:scale-[0.98] transition-all cursor-pointer text-xs"
              >
                Settle Offline (Cash/Direct UPI) 💵
              </button>
              <button
                onClick={() => setActiveSettle(null)}
                className="w-full py-2 text-on-surface-variant hover:text-on-surface text-center font-bold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default Expense;
