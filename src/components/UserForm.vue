<script setup>
import { reactive, ref } from "vue";

const createForm = () => ({
  name: "",
  email: "",
  phone: "",
  age: "",
  gender: "",
  birthday: "",
  country: "",
  website: "",
  bio: "",
  agree: false,
});

const form = reactive(createForm());
const errors = reactive({});
const submitted = ref(null);

const countries = ["China", "United States", "Japan", "Germany", "Other"];

function validate() {
  Object.keys(errors).forEach((key) => delete errors[key]);

  if (!form.name.trim()) errors.name = "Name is required.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
    errors.email = "Enter a valid email.";
  if (form.age !== "" && (Number(form.age) < 0 || Number(form.age) > 150))
    errors.age = "Age must be between 0 and 150.";
  if (form.website && !/^https?:\/\/.+/.test(form.website))
    errors.website = "URL must start with http:// or https://";
  if (!form.agree) errors.agree = "You must accept the terms.";

  return Object.keys(errors).length === 0;
}

function handleSubmit() {
  if (!validate()) {
    submitted.value = null;
    return;
  }
  submitted.value = { ...form };
}

function handleReset() {
  Object.assign(form, createForm());
  Object.keys(errors).forEach((key) => delete errors[key]);
  submitted.value = null;
}
</script>

<template>
  <form class="user-form" novalidate @submit.prevent="handleSubmit">
    <h2>User Profile</h2>

    <div class="grid">
      <label class="field">
        <span>Name *</span>
        <input v-model="form.name" type="text" placeholder="Jane Doe" />
        <small v-if="errors.name" class="err">{{ errors.name }}</small>
      </label>

      <label class="field">
        <span>Email *</span>
        <input v-model="form.email" type="email" placeholder="jane@example.com" />
        <small v-if="errors.email" class="err">{{ errors.email }}</small>
      </label>

      <label class="field">
        <span>Phone</span>
        <input v-model="form.phone" type="tel" placeholder="+1 555 0100" />
      </label>

      <label class="field">
        <span>Age</span>
        <input v-model="form.age" type="number" min="0" max="150" placeholder="30" />
        <small v-if="errors.age" class="err">{{ errors.age }}</small>
      </label>

      <label class="field">
        <span>Gender</span>
        <select v-model="form.gender">
          <option value="">Select…</option>
          <option value="female">Female</option>
          <option value="male">Male</option>
          <option value="other">Other</option>
        </select>
      </label>

      <label class="field">
        <span>Birthday</span>
        <input v-model="form.birthday" type="date" />
      </label>

      <label class="field">
        <span>Country</span>
        <select v-model="form.country">
          <option value="">Select…</option>
          <option v-for="c in countries" :key="c" :value="c">{{ c }}</option>
        </select>
      </label>

      <label class="field">
        <span>Website</span>
        <input v-model="form.website" type="url" placeholder="https://example.com" />
        <small v-if="errors.website" class="err">{{ errors.website }}</small>
      </label>

      <label class="field field--full">
        <span>Bio</span>
        <textarea v-model="form.bio" rows="3" placeholder="Tell us about yourself…" />
      </label>

      <label class="field field--full checkbox">
        <input v-model="form.agree" type="checkbox" />
        <span>I accept the terms and conditions *</span>
      </label>
      <small v-if="errors.agree" class="err field--full">{{ errors.agree }}</small>
    </div>

    <div class="actions">
      <button type="submit">Submit</button>
      <button type="button" class="ghost" @click="handleReset">Reset</button>
    </div>

    <pre v-if="submitted" class="result">{{ JSON.stringify(submitted, null, 2) }}</pre>
  </form>
</template>

<style scoped>
.user-form {
  width: min(640px, 90vw);
  text-align: left;
}

h2 {
  margin: 0 0 1.25rem;
  text-align: center;
}

.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.85rem;
  color: #cbd5e1;
}

.field--full {
  grid-column: 1 / -1;
}

.checkbox {
  flex-direction: row;
  align-items: center;
  gap: 0.5rem;
}

input,
select,
textarea {
  font: inherit;
  padding: 0.55rem 0.7rem;
  border-radius: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.05);
  color: #e5e7eb;
}

.checkbox input {
  width: 1rem;
  height: 1rem;
  padding: 0;
}

input:focus,
select:focus,
textarea:focus {
  outline: none;
  border-color: #60a5fa;
}

.err {
  color: #f87171;
  font-size: 0.75rem;
}

.actions {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  margin-top: 1.5rem;
}

.ghost {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.result {
  margin-top: 1.5rem;
  padding: 1rem;
  border-radius: 0.5rem;
  background: rgba(0, 0, 0, 0.35);
  color: #a5f3fc;
  font-size: 0.8rem;
  overflow-x: auto;
}
</style>
