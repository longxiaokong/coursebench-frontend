import { provide, reactive, onMounted, computed, inject } from "@vue/composition-api"
import vue from "@/main.js"
import useFetching from "@/composables/global/useFetching"
import useWatching from "@/composables/global/useWatching"
import useRefCopy from "@/composables/global/useRefCopy"

export default () => {

  const showSnackbar = inject("showSnackbar")

  let teacherDetail = reactive({
    "id": 0,
    "name": "",
    "avatar": "",
    "institute": "",
    "job": "",
    "introduction": "",
    "courses": [],
  })

  let courseText = reactive([])

  const courseStatistic = reactive({
    total: 0,
    score: 0,
    count: {
      "信息科学与技术学院": 0,
      "物质科学与技术学院": 0,
      "生命科学与技术学院": 0,
      "创意与艺术学院": 0,
      "创业与管理学院": 0,
      "人文科学研究院": 0,
      "生物医学工程学院": 0,
      "数学科学研究所": 0,
      "其他学院": 0,
    }
  })

  const status = reactive({
    selected: computed(() => {
      let ret = new Array()
      for (let key in courseStatistic.count) {
        if (courseStatistic.count[key]) {
          ret.push(key)
        }
      }
      return ret
    }),
    loading: true
  })

  const getCourseStatistic = () => {
    courseStatistic.total = teacherDetail.courses.length
    const schools = Object.getOwnPropertyNames(courseStatistic.count).filter((key) => {
      return key != "__ob__" && key != "其他学院"
    })
    for (let course of teacherDetail.courses) {
      if (schools.indexOf(course.institute) >= 0) {
        courseStatistic.count[course.institute]++
      } else {
        courseStatistic.count["其他学院"]++
      }
    }
  }

  const getTeacherDetail = () => {
    const id = vue.$route.params.id
    const { status: fetchStatus, data, error } = useFetching("teacher_" + id, "/teacher/" + id)
    useWatching(fetchStatus, () => {
      if (fetchStatus.value == "success") {
        status.loading = false
      } else if (fetchStatus.value == "error") {
        if (error.value.code === "ECONNABORTED") {
          showSnackbar("error", "网络连接失败")
        } else {
          showSnackbar("error", error.value.response.data.msg)
        }
        setTimeout(() => {
          vue.$router.push("/")
        }, 5000)
      }
    })
    useWatching(data, () => {
      if (data.value) {
        useRefCopy(data.value.data, teacherDetail)
        getCourseStatistic()
        useRefCopy(teacherDetail.courses, courseText)
      }
    })
  }

  onMounted(() => {
    getTeacherDetail()
  })

  provide("courseStatistic", courseStatistic)

  provide("courseStatus", status)

  provide("teacherDetail", teacherDetail)

  return { courseText, status }

}