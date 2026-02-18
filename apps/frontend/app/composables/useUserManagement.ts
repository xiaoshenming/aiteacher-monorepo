export function useUserManagement() {
  const { apiFetch } = useApi()
  const toast = useToast()

  const search = ref('')
  const roleFilter = ref('')
  const users = ref<any[]>([])
  const loading = ref(false)

  const roleOptions = [
    { label: '全部角色', value: '' },
    { label: '学生', value: '0' },
    { label: '普通用户', value: '1' },
    { label: '教师', value: '2' },
    { label: '管理员', value: '3' },
    { label: '超级管理员', value: '4' },
  ]

  const roleMap: Record<string, string> = {
    '0': '学生', '1': '普通用户', '2': '教师', '3': '管理员', '4': '超级管理员',
  }

  const columns = [
    { accessorKey: 'id', header: 'ID' },
    { accessorKey: 'name', header: '姓名' },
    { accessorKey: 'email', header: '邮箱' },
    { accessorKey: 'role', header: '角色' },
    { accessorKey: 'created_at', header: '注册时间' },
    { accessorKey: 'actions', header: '操作' },
  ]

  const filteredUsers = computed(() => {
    let list = users.value
    if (search.value) {
      const q = search.value.toLowerCase()
      list = list.filter(u => u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q))
    }
    if (roleFilter.value) {
      list = list.filter(u => String(u.role) === roleFilter.value)
    }
    return list
  })

  async function loadUsers() {
    loading.value = true
    try {
      const res = await apiFetch<{ code: number, data: any[] }>('/admin/user')
      users.value = res.data || []
    }
    catch {
      users.value = []
    }
    finally {
      loading.value = false
    }
  }

  // Modal state
  const showAddModal = ref(false)
  const showEditModal = ref(false)
  const editingUser = ref<any>(null)
  const form = ref({ name: '', email: '', password: '', role: '0' })

  function openAdd() {
    form.value = { name: '', email: '', password: '', role: '0' }
    showAddModal.value = true
  }

  function openEdit(user: any) {
    editingUser.value = user
    form.value = { name: user.name, email: user.email, password: '', role: String(user.role) }
    showEditModal.value = true
  }

  async function submitAdd() {
    try {
      await apiFetch('/admin/user', { method: 'POST', body: form.value })
      toast.add({ title: '用户创建成功', color: 'success' })
      showAddModal.value = false
      loadUsers()
    }
    catch {
      toast.add({ title: '创建失败', color: 'error' })
    }
  }

  async function submitEdit() {
    if (!editingUser.value) return
    try {
      const body: any = { name: form.value.name, email: form.value.email, role: form.value.role }
      if (form.value.password) body.password = form.value.password
      await apiFetch(`/admin/user/${editingUser.value.id}`, { method: 'PUT', body })
      toast.add({ title: '用户更新成功', color: 'success' })
      showEditModal.value = false
      loadUsers()
    }
    catch {
      toast.add({ title: '更新失败', color: 'error' })
    }
  }

  async function deleteUser(user: any) {
    if (!confirm(`确定删除用户 "${user.name}" 吗？`)) return
    try {
      await apiFetch(`/admin/user/${user.id}`, { method: 'DELETE' })
      toast.add({ title: '用户已删除', color: 'success' })
      loadUsers()
    }
    catch {
      toast.add({ title: '删除失败', color: 'error' })
    }
  }

  onMounted(loadUsers)

  return {
    search,
    roleFilter,
    users,
    loading,
    roleOptions,
    roleMap,
    columns,
    filteredUsers,
    showAddModal,
    showEditModal,
    form,
    openAdd,
    openEdit,
    submitAdd,
    submitEdit,
    deleteUser,
    loadUsers,
  }
}
