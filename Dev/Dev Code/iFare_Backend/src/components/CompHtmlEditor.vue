<template>
  <editor v-model="editorValue" :init="init" />
</template>

<script setup lang="ts">
import { ref, reactive, computed, toRefs } from "vue";
import "tinymce/tinymce.js";

// 外觀
import "tinymce/skins/ui/oxide/skin.css";
import "tinymce/themes/silver";

// Icon
import "tinymce/icons/default";

import "tinymce-i18n/langs/zh_TW.js";

import "tinymce/plugins/emoticons";
import "tinymce/plugins/emoticons/js/emojis.js";
import "tinymce/plugins/table";
import "tinymce/plugins/quickbars";
import "tinymce/plugins/link"
import "tinymce/plugins/image"
import "tinymce/plugins/lists"
import "tinymce/plugins/media"
import "tinymce/plugins/advlist"

import Editor from "@tinymce/tinymce-vue";

const content_style_default = "@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700&family=Noto+Serif+TC:wght@400;500;700&family=Noto+Serif:wght@400;500;700&family=Roboto:wght@400;500;700&family=Noto+Serif+Display:wght@700&display=swap');" +
            "html { background: linear-gradient(0deg,rgba(234,85,4,.07),rgba(234,85,4,.07)),#fff;}" + 
            "body { margin: 0 auto; max-width: 800px; padding: 48px; background: hsla(0,0%,100%,.7); border-radius: 16px; font-family: Noto Sans TC!important; font-size: 18px;}" + 
            "p, .f-content {font-size: 18px; font-weight: 400; line-height: 38px;}" +
            "h1, .f-h1 {font-size: 22px; font-weight: 700; line-height: 34px;}" +
            "h2, .f-h2 {font-size: 20px; font-weight: 500; line-height: 32px;}" +
            "h3, .f-h3 {font-size: 18px; font-weight: 500; line-height: 28px;}" +
            "img {width: 100%!important; height: auto!important;}" +
            "table td, table th {border: 1pt solid rgba(23,24,24,.1)!important}"

const props = defineProps({
  editorType: {
    type: String,
    default: "normal"
  },
  editorValue: {
    type: String,
    default: "",
  },
  plugins: {
    type: [String, Array],
    default: "quickbars emoticons table link image lists advlist media",
  },
  content_style: {
    type: String,
    default: content_style_default
  },
  formats: {
    type: Object,
    default: {
      fH1: { block: 'h1', attributes: {class: 'f-h1'} },
      fH2: { block: 'h2', attributes: {class: 'f-h2'} },
      fH3: { block: 'h3', attributes: {class: 'f-h3'} },
      fDefault: { block: 'p', attributes: {class: 'f-content'}}  // Default can not change.
    }
  },
  style_formats: {
    type: Array<Object>,
    default: [
      { title: '內文', format: 'fDefault'},
      { title: '大標', format: 'fH1'},
      { title: '副標', format: 'fH2'},
      { title: '小標', format: 'fH3'}
    ]
  },
  toolbar: {
    type: [String, Array],
    default:
      "undo redo | styleselect | bold forecolor | image link media | alignleft aligncenter alignright | bullist numlist outdent indent | table",
  },
  quickbar: {
    type: [String, Array],
    default: "styleselect | bold forecolor | image link media | alignleft aligncenter alignright | bullist numlist outdent indent | table"
  },
  color_map: {
    type: [String],
    default: [
      '171818', 'Black',
      // '#5c5d5d', 'Black_700',
      // '#8b8b8b', 'Black_500',
      // '#b9b9b9', 'Black_300',
      'FFFFFF', 'White',
      // '#b3b3b3', 'White_700',
      // '#808080', 'White_500',
      // '#4d4d4d', 'White_300',
      '00ADB2', 'Primary',
      'E5006E', 'Pink',
      '007D81', 'Primary-Dark',
      'EA5504', 'Orange'
    ]
  },
  table_toolbar: {
    type: [String, Array],
    default: "tableprops tabledelete | tablecellvalign | tableinsertrowbefore tableinsertrowafter tabledeleterow | tableinsertcolbefore tableinsertcolafter tabledeletecol"
  }
});

const emits = defineEmits(['update:editorValue'])

const content_style_ifare = content_style_default.replace("background: linear-gradient(0deg,rgba(234,85,4,.07),rgba(234,85,4,.07)),#fff;", "background: linear-gradient(0deg, rgba(26, 100, 102, 0.08) 0%, rgba(26, 100, 102, 0.08) 100%), #FFFFFF;")
                                                .replace("background: hsla(0,0%,100%,.7);", "background: #FFFFFF;")

const init = reactive({
  language: "zh_TW",
  height: 500,
  menubar: false,
  content_css: false,
  skin: false,
  plugins: props.plugins,
  content_style: props.editorType != 'ifare' ? props.content_style : content_style_ifare,
  formats: props.formats,
  style_formats: props.style_formats,
  toolbar: props.toolbar,
  color_map: props.color_map,
  table_toolbar: props.table_toolbar,
  quickbars_insert_toolbar: false,
  quickbars_selection_toolbar: props.quickbar,
  branding: false,
  init_instance_callback : (editor:any) => {
    console.log(editor)
    editor.editorManager.execCommand("mceToggleFormat", false, 'fDefault')
  }
});

// const { modelValue } = toRefs(props);

const editorValue = computed({
    get() {
        console.log(props.editorValue)
        return props.editorValue
    },
    set(value) {
        emits('update:editorValue', value)
    }
})

</script>
