import type { Course, ClassInfo, Assistant } from '~/types/course'

type CourseDetail = Course & { classes?: ClassInfo[], assistants?: Assistant[] }

export function useCourseDetail(courseId: Ref<number>) {
  const courses = useCourses()
  const router = useRouter()
  const toast = useToast()

  const loading = ref(true)
  const course = ref<CourseDetail | null>(null)

  // 添加班级
  const showAddClass = ref(false)
  const allClasses = ref<ClassInfo[]>([])
  const addingClassId = ref<number | null>(null)

  // 添加助教
  const showAddAssistant = ref(false)
  const teachers = ref<Assistant[]>([])
  const addingAssistantId = ref<number | null>(null)

  async function loadCourse() {
    loading.value = true
    try {
      course.value = await courses.fetchCourseDetail(courseId.value)
    }
    catch (err) {
      console.error('加载课程详情失败:', err)
      toast.add({ title: '加载课程详情失败', color: 'error' })
      router.push('/user/courses')
    }
    finally {
      loading.value = false
    }
  }

  async function loadClasses() {
    showAddClass.value = true
    try {
      allClasses.value = await courses.fetchClasses()
    }
    catch (err) {
      console.error('加载班级列表失败:', err)
    }
  }

  async function loadTeachers() {
    showAddAssistant.value = true
    try {
      teachers.value = await courses.fetchTeachers()
    }
    catch (err) {
      console.error('加载教师列表失败:', err)
    }
  }

  async function linkClass(classId: number) {
    addingClassId.value = classId
    try {
      await courses.addClassToCourse(courseId.value, classId)
      toast.add({ title: '班级已关联', color: 'success' })
      showAddClass.value = false
      await loadCourse()
    }
    catch (err) {
      console.error('关联班级失败:', err)
      toast.add({ title: '关联班级失败', color: 'error' })
    }
    finally {
      addingClassId.value = null
    }
  }

  async function unlinkClass(_classId: number) {
    // 预留：取消关联班级
  }

  async function addAssistant(teacherId: number) {
    addingAssistantId.value = teacherId
    try {
      await courses.addAssistant(courseId.value, teacherId)
      toast.add({ title: '助教已添加', color: 'success' })
      showAddAssistant.value = false
      await loadCourse()
    }
    catch (err) {
      console.error('添加助教失败:', err)
      toast.add({ title: '添加助教失败', color: 'error' })
    }
    finally {
      addingAssistantId.value = null
    }
  }

  async function removeAssistant(assistantId: number) {
    try {
      await courses.removeAssistant(courseId.value, assistantId)
      toast.add({ title: '助教已移除', color: 'success' })
      await loadCourse()
    }
    catch (err) {
      console.error('移除助教失败:', err)
      toast.add({ title: '移除助教失败', color: 'error' })
    }
  }

  function goToClass(classId: number) {
    router.push(`/user/classes/${classId}`)
  }

  return {
    loading,
    course,
    showAddClass,
    allClasses,
    addingClassId,
    showAddAssistant,
    teachers,
    addingAssistantId,
    loadCourse,
    loadClasses,
    loadTeachers,
    linkClass,
    unlinkClass,
    addAssistant,
    removeAssistant,
    goToClass,
  }
}
