<template>
  <div style="margin-left: 20px">
  <div>Menu</div>
    <ul>
      <li v-for="meal in meals" :key="meal.id">
        <div style="margin-left: 5px; margin-top: 20px">
          <div> {{meal.name}}</div>
          <div>Price {{meal.price}} Euro </div>
        </div>
      </li>
    </ul>
    <div>
</div>
<div>Meal of the day - {{mealOfTheDay.name}}</div>
<div style="margin-top: 20px"/>
<div>Best steak in town - {{meals[2].price}} Euro !</div>
<div style="margin-top: 20px"/>
<label>Store manager commands:</label>
<div>
<button v-on:click="new_day">New Day</button>
<button v-on:click="discount_all">Discount all</button>
</div>

  <div>
    <ul>
      <li v-for="problem in problems" :key="problem.id">
        <div style="margin-left: 5px; margin-top: 20px">
          <form @submit.prevent>
            <span>{{ problem.a }}</span>
            <span v-if="problem.isAddProblem"> + </span>
            <span v-if="!problem.isAddProblem"> - </span>
            <span> {{ problem.b }}</span> =
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
          <td>
            <span> Addition </span>
          </td>
          <td>
            <span> {{ count_right_add }}</span>
          </td>
          <td>
            <span> {{ count_wrong_add }}</span>
          </td>
          <td>
            <span> {{ accuracy_add }}</span>
          </td>
        </tr>

        <tr>
          <td>
            <span> Subtraction </span>
          </td>
          <td>
            <span> {{ count_right_sub }}</span>
          </td>
          <td>
            <span> {{ count_wrong_sub }}</span>
          </td>
          <td>
            <span> {{ accuracy_sub }}</span>
          </td>
        </tr>
      </table>
    </div>
  </div>
 <div>
    <ul>
      <li v-for="otherProblem in otherProblems" :key="otherProblem.id">
        <div style="margin-left: 5px; margin-top: 20px">
          <form @submit.prevent>
            <span>{{ otherProblem.a }}</span>
            <span v-if="otherProblem.isAddotherProblem"> + </span>
            <span v-if="!otherProblem.isAddotherProblem"> - </span>
            <span> {{ otherProblem.b }}</span> =
            <span><input class="question" v-model="otherProblem.answer" /></span>
            <button
              class="btn btn-primary"
              style="margin-left: 5px"
              :disabled="!may_check_other(otherProblem)"
              type="submit"
              @click="check_answer(otherProblem)"
            >
              Check2
            </button>
            <button
              class="btn btn-success"
              style="margin-left: 5px"
              disabled="1"
              v-if="otherProblem.right === true"
            >
              Right2
            </button>
            <button
              class="btn btn-danger"
              style="margin-left: 5px"
              disabled="1"
              v-if="otherProblem.right === false"
            >
              Wrong2
            </button>
            <button
              class="btn btn-info"
              style="margin-left: 5px"
              @click="sub_otherProblem()"
              v-if="otherProblem.isAddotherProblem"
            >
              New Sub Problem 2
            </button>
            <button
              class="btn btn-info"
              style="margin-left: 5px"
              @click="add_otherProblem()"
              v-if="otherProblem.isAddotherProblem === false"
            >
              New Add Problem 2
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
          <td>
            <span> Addition </span>
          </td>
          <td>
            <span> {{ count_right_add }}</span>
          </td>
          <td>
            <span> {{ count_wrong_add }}</span>
          </td>
          <td>
            <span> {{ accuracy_add }}</span>
          </td>
        </tr>

        <tr>
          <td>
            <span> Subtraction </span>
          </td>
          <td>
            <span> {{ count_right_sub }}</span>
          </td>
          <td>
            <span> {{ count_wrong_sub }}</span>
          </td>
          <td>
            <span> {{ accuracy_sub }}</span>
          </td>
        </tr>
      </table>
    </div>
  </div>
  </div>
</template>

<script>
export default {
   props: {
    msg: String,
  },
  name: "HelloWorld",
  data() {
    return {
      answers: [],
      mealOfTheDay: undefined,
      isFriday: false,
       problems: [],
       otherProblems: [],
      count_right_add: 0,
      count_wrong_add: 0,
      count_right_sub: 0,
      count_wrong_sub: 0,
    };
  },
  created: function () {
    this.init();
      this.add_problem();
  },
    computed: {
    accuracy_add: function () {
      let n = this.count_wrong_add + this.count_right_add;
      return n == 0 ? 0 : this.count_right_add / n;
    },
    accuracy_sub: function () {
      let n = this.count_wrong_sub + this.count_right_sub;
      return n == 0 ? 0 : this.count_right_sub / n;
    },
  },
  methods: {
    init() {
      this.meals = [
        {name:"Soup",  id:0, price: 1 },
        {name:"Salad", id:1, price: 2 },
        {name:"Steak", id:2, price: 7 },
      ]
      this.new_day();
    },
    new_day:function(){
      this.isFriday = !this.isFriday
      if(this.isFriday){
        this.meals[0].price = this.meals[0].price * 2

        this.meals[1].price = this.meals[1].price / 2
        this.mealOfTheDay= this.meals[1]
      }
      else {
        this.meals[1].price = this.meals[1].price * 2

        this.meals[0].price = this.meals[0].price / 2
        this.mealOfTheDay = this.meals[0]
      }
    },
    discount_all:function(){
    for (var i = 0; i < this.meals.length; i++) {
      this.meals[i].price = this.meals[i].price - 0.20
    }
    },
        add_problem() {
      let max = 100;

      let isAddProblem = Math.random() > 0.5;

      let c1 = Math.floor(Math.random() * (max - 1)) + 1;
      let a1 = Math.floor(Math.random() * (c1 - 2)) + 1;
      let b1 = c1 - a1;
      let id = this.problems.length + 1;

      let problem = isAddProblem
        ? {
            c: c1,
            a: a1,
            b: b1,
            id,
            answer: undefined,
            right: undefined,
            isAddProblem,
          }
        : {
            c: b1,
            a: c1,
            b: a1,
            id,
            answer: undefined,
            right: undefined,
            isAddProblem,
          };
      this.problems.push(problem);
    },

    check_answer(problem) {
      problem.right = problem.c === parseInt(problem.answer);
      if (problem.isAddProblem)
        problem.right
          ? (this.count_right_add += 1)
          : (this.count_wrong_add += 1);
      else
        problem.right
          ? (this.count_right_sub += 1)
          : (this.count_wrong_sub += 1);
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
     sub_otherProblem() {
      let max = 100;

      let a = Math.floor(Math.random() * (max - 1)) + 1;
      let b = Math.floor(Math.random() * (a - 2)) + 1;
      let c = a - b;
      let id = this.otherProblems.length + 1;

      let otherProblem = {
        c,
        a,
        b,
        id,
        answer: undefined,
        right: undefined,
        isAddotherProblem: false,
      };
      this.otherProblems.push(otherProblem);
    },
    add_otherProblem() {
      let max = 100;

      let c = Math.floor(Math.random() * (max - 1)) + 1;
      let a = Math.floor(Math.random() * (c - 2)) + 1;
      let b = c - a;
      let id = this.otherProblems.length + 1;

      let otherProblem = {
        c,
        a,
        b,
        id,
        answer: undefined,
        right: undefined,
        isAddotherProblem: true,
      };
      this.otherProblems.push(otherProblem);
    },

    check_answer(otherProblem) {
      otherProblem.right = otherProblem.c === parseInt(otherProblem.answer);
      if (otherProblem.isAddotherProblem)
        otherProblem.right
          ? (this.count_right_add += 1)
          : (this.count_wrong_add += 1);
      else
        otherProblem.right
          ? (this.count_right_sub += 1)
          : (this.count_wrong_sub += 1);
    },
    may_check_other(otherProblem) {
      // answer non-empty and right undefined
      return (
        !(otherProblem.answer === undefined || otherProblem.answer === "") &&
        otherProblem.right === undefined
      );
    },
    new_otherProblem() {
      this.add_otherProblem();
    },
  },
};
</script>
