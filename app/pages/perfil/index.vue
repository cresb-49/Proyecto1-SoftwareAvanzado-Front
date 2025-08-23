<template>
  <div></div>
</template>

<script lang="ts" setup>
definePageMeta({
  middleware: ["auth"],
});
import InputText from "~/components/ui/InputText.vue";
import Button from "~/components/ui/Button.vue";
import { useAuth } from "~/composables/useAuth";
import { useUserService } from "~/services/users";
import { reactive, ref } from "vue";
import { useToast } from "~/composables/useToast";

const { hasAnyRole, redirectIfAdmin, redirectIfNotCustomer } = useUseRoles();
const permitedRoles = [Roles.ADMIN, Roles.HOTEL_MANAGER, Roles.CUSTOMER];
const canManage = computed(() => hasAnyRole(permitedRoles));
redirectIfAdmin("/perfil/admin");
redirectIfNotCustomer("/perfil/empleado");

const toast = useToast();
const auth = useAuth();
const route = useRoute();
</script>
