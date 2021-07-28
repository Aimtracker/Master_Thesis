<template>
  <div>
    <ul>
      <li v-for="problem in problems" :key="problem.id">
        <div style="margin-left: 5px; margin-top: 20px">
          <form @submit.prevent>
            <span>{{ problem.a }}</span> + <span> {{ problem.b }}</span> =
            <span><input class="question" v-model="problem.answer" /></span>
            <button
              class="btn btn-primary"
              style="margin-left: 5px"
              :disabled="!may_check(problem)"
              type="submit"
              @click="check_answer(problem)"
            >
              Check
            </button>
            <button
              class="btn btn-success"
              style="margin-left: 5px"
              disabled="1"
              v-if="problem.right === true"
            >
              Right
            </button>
            <button
              class="btn btn-danger"
              style="margin-left: 5px"
              disabled="1"
              v-if="problem.right === false"
            >
              Wrong
            </button>
            <button
              class="btn btn-info"
              style="margin-left: 5px"
              @click="new_problem()"
            >
              New Problem
            </button>
          </form>
        </div>
      </li>
    </ul>
    <hr />
    <div style="margin-left: 5px">
      <table>
        <tr>
          <td><strong>Statistics&nbsp;</strong></td>
          <td><span class="badge badge-success">Right</span></td>
          <td><span class="badge badge-danger">Wrong</span></td>
          <td><span class="badge badge-info">Accuracy</span></td>
        </tr>
        <tr>
          <td />
          <td>
            <span> {{ count_right }}</span>
          </td>
          <td>
            <span> {{ count_wrong }}</span>
          </td>
          <td>
            <span> {{ accuracy }}</span>
          </td>
        </tr>
      </table>
    </div>
    <span id="tmp">First Problem{{ problems[0].a }}</span>
  </div>
</template>

<script>
export default {
  name: "HelloWorld",
  props: {
    msg: String,
  },
  data() {
    return {
      problems: [],
      count_right: 0,
      count_wrong: 0,
      nested: { property: 1 },
    };
  },
  computed: {
    accuracy: function () {
      let n = this.count_wrong + this.count_right;
      return n == 0 ? 0 : this.count_right / n;
    },
  },
  created: function () {
    this.add_problem();
  },
  methods: {
    add_problem() {
      let max = 100;

      let c = Math.floor(Math.random() * (max - 1)) + 1;
      let a = Math.floor(Math.random() * (c - 2)) + 1;
      let b = c - a;
      let id = this.problems.length + 1;
      let problem = { c, a, b, id, answer: undefined, right: undefined };
      this.problems.push(problem);
    },
    check_answer(problem) {
      problem.right = problem.c === parseInt(problem.answer);
      problem.right ? (this.count_right += 1) : (this.count_wrong += 1);
    },
    may_check(problem) {
      // answer non-empty and right undefined
      return (
        !(problem.answer === undefined || problem.answer === "") &&
        problem.right === undefined
      );
    },
    new_problem() {
      this.add_problem();
    },
  },
};
</script>
<style scoped>
.index {
  padding: 0 20px 0 5px;
}

.question {
  font-color: white;
  width: 2em;
  background-color: #3ff;
  margin-left: 5px;
  margin-righ: 5px;
}
</style>
