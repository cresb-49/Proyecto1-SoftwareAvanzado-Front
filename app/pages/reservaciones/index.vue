<template>
  <div></div>
</template>

<script lang="ts" setup>
definePageMeta({ middleware: ["auth"] });

import { reactive, ref, computed } from "vue";
import { useUseRoles } from "~/composables/useRoles";
import { Roles } from "#imports";
import { useHotelService } from "~/services/hotels";
import { useToast } from "~/composables/useToast";
import { useRoomService } from "~/services/rooms";

import Button from "~/components/ui/Button.vue";
import Card from "~/components/ui/Card.vue";
import Select from "~/components/ui/Select.vue";
import InputNumber from "~/components/ui/InputNumber.vue";
import InputCurrency from "~/components/ui/InputCurrency.vue";

const { hasAnyRole, redirectIfUnauthorized } = useUseRoles();
const permitedRoles = [Roles.ADMIN, Roles.HOTEL_MANAGER, Roles.CUSTOMER];
const canManageHotels = computed(() => hasAnyRole(permitedRoles));
redirectIfUnauthorized(permitedRoles, "/");
</script>

<style></style>
