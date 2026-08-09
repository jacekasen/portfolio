---
title: 'Decoding Wrist EMG to Text with Recurrent, Convolutional-Recurrent, and Transformer Architectures'
date: '2026-03-20'
description: 'I compared a TDS convolution baseline against bidirectional LSTM, GRU, ResNet18 + LSTM, and Transformer encoders on the EMG-to-QWERTY typing task. The plain bidirectional LSTM won, cutting test CER from 24.18% to 18.95%.'
tags: ['Machine Learning', 'Deep Learning', 'PyTorch', 'UCLA', 'Python']
---

> I compared a TDS convolution baseline against bidirectional LSTM, GRU, ResNet18 + LSTM, and Transformer encoders on the EMG-to-QWERTY typing task. The plain bidirectional LSTM won, cutting test CER from 24.18% to 18.95%.

> This was my course project for ECE-C147: Neural Networks and Deep Learning at UCLA, Winter 2026. Code: [jacekasen/ece-c147a-project-submission](https://github.com/jacekasen/ece-c147a-project-submission).

## 1. Introduction

This project investigates how different sequence modeling architectures affect performance on the EMG-to-QWERTY decoding dataset — the problem of recovering typed text from wrist electromyography signals. Starting from the provided time-depth separable convolution (TDS) baseline, the objective was to determine whether models with stronger temporal modeling capacity could reduce character error rate (CER) on the single-user dataset.

The baseline convolutional model performs reasonably well, but EMG typing signals exhibit complex temporal structure that may be better captured by architectures designed explicitly for sequential data. Recurrent networks such as LSTMs and GRUs provide direct mechanisms for modeling temporal dependencies, convolutional–recurrent hybrids combine spatial feature extraction with sequence modeling, and Transformers model long-range relationships through self-attention.

To explore these design choices, I implemented and evaluated several post-convolution architectures under a shared preprocessing and training pipeline. Specifically, the baseline TDS model was compared against a bidirectional LSTM, a bidirectional GRU, a ResNet18 + LSTM hybrid, and a Transformer encoder trained with CTC loss. All models used the same input representation, augmentation pipeline, and decoding procedure to ensure fair comparison.

## 2. Methods

### 2.1. Dataset and split

Experiments were conducted on the provided single-user EMG typing dataset, consisting of multiple recording sessions from a single participant wearing EMG recording bands on both wrists. The official train, validation, and test splits provided with the project codebase were used.

During training and validation, windowed segments were sampled from their respective sessions. At test time, the full held-out session was decoded as a single continuous sequence to better approximate realistic typing conditions.

### 2.2. Input representation

Each example consisted of EMG recordings sampled at 2000 Hz from two recording bands, each containing 16 electrode channels, for a total of 32 channels. Raw EMG signals were converted into log-spectrogram features using a short-time Fourier transform with FFT size 64 and hop length 16. This produced a time-frequency representation for each electrode channel, with resulting tensors of shape (T, N, 2, 16, F), where T is temporal length, N is batch size, and F is the number of frequency bins.

### 2.3. Feature preprocessing

All architectures shared the same frontend. Spectrogram inputs were normalized with batch normalization applied independently to each electrode channel. A multi-band rotation-invariant MLP then processed each EMG band separately while pooling across small electrode rotations — this improves robustness to small shifts in electrode placement while preserving the underlying muscle activity patterns. The resulting per-band features were concatenated and flattened before being passed to the sequence encoder.

### 2.4. Data augmentation

All experiments used the same augmentation pipeline during training:

- conversion to tensor
- random band rotation with offsets {−1, 0, 1}
- temporal alignment jitter with maximum offset 120
- log-spectrogram transformation
- SpecAugment with time masking and frequency masking

Validation and test data were processed deterministically without augmentation.

### 2.5. Training setup

All models were trained with the same optimization configuration:

- optimizer: Adam
- learning rate: 0.001
- scheduler: linear warmup with cosine annealing
- batch size: 32
- training duration: up to 40 epochs

Models were trained using Connectionist Temporal Classification (CTC) loss, and predictions were generated using greedy CTC decoding. Performance was evaluated using character error rate (CER), decomposed into insertion (IER), deletion (DER), and substitution (SER) error rates.

### 2.6. Architectures

All models share the preprocessing and feature extraction pipeline described above. The primary difference lies in the sequence encoder used to model temporal structure.

**TDS baseline.** The provided baseline uses a time-depth separable convolution encoder applied to the extracted spectrogram features: stacked temporal convolution blocks with residual connections that model temporal dependencies without explicit recurrence.

**Bidirectional LSTM.** The convolutional encoder was replaced with a stacked bidirectional LSTM — three layers, hidden size 512, dropout 0.1 between layers. Bidirectional recurrence lets the model incorporate both past and future temporal context when predicting characters, and because the LSTM preserves temporal resolution, its outputs are directly compatible with CTC training.

**Bidirectional GRU.** Same dimensional configuration as the LSTM. The GRU replaces the LSTM memory cell with a simpler gating mechanism, resulting in fewer parameters while maintaining similar sequence modeling capacity.

**ResNet18 + LSTM.** A hybrid where a ResNet18 encoder processes each spectrogram frame independently and produces a compact spatial feature representation, which is then fed into a bidirectional LSTM that models temporal dependencies across frames.

**Transformer encoder.** The model projects input features to a fixed embedding dimension and adds sinusoidal positional encoding to preserve temporal order. A stack of multi-head self-attention layers then models long-range temporal relationships across the sequence, trained with the same CTC objective.

## 3. Results

### 3.1. Final quantitative comparison

| Model              | Parameters | Best Val CER (%) | Test CER (%) |
| :----------------- | ---------: | ---------------: | -----------: |
| TDS baseline       |       5.3M |            22.55 |        24.18 |
| Bidirectional LSTM |      18.4M |            19.14 |    **18.95** |
| Bidirectional GRU  |      13.9M |        **18.14** |        26.09 |
| ResNet18 + LSTM    |      21.8M |            29.97 |        28.42 |
| Transformer        |       3.8M |            24.04 |          N/A |

The bidirectional LSTM achieved the best overall performance, reducing test CER from 24.18% for the baseline to 18.95%. This represents the largest improvement among all tested architectures.

The GRU achieved the lowest validation CER (18.14%) but performed substantially worse on the held-out test session, suggesting weaker generalization. The ResNet18 + LSTM hybrid performed worse than both the recurrent models and the baseline despite having the largest parameter count. The Transformer reached 24.04% validation CER, slightly worse than the baseline, but full-session test evaluation could not be completed because the sinusoidal positional encoding was limited to sequences of length 5000, whereas the held-out test session had length 140757.

### 3.2. Training dynamics

![Validation CER during training for the baseline, GRU, LSTM, ResNet18 + LSTM, and Transformer over the first 40 epochs](/images/emg-c147/val-cer-40-epochs.png)

**Fig 1. Validation CER during training over the first 40 epochs.**

Across all architectures, validation CER remained extremely high during the early stages of training. During the first several epochs the models produced long random character sequences under the CTC objective, resulting in very large insertion counts and CER values far exceeding 100%; that initial region is not shown in the figure. Meaningful learning began after roughly 10–15 epochs, when the models started producing mostly blank predictions and gradually learned correct temporal alignments.

Once learning began, the GRU exhibited the fastest early improvement, with validation CER dropping sharply shortly after epoch 12. The baseline TDS model also improved quickly and showed stable convergence throughout training. The ResNet18 + LSTM hybrid improved more slowly than the baseline and converged to a higher final validation error than the GRU. The bidirectional LSTM reduced error more gradually early on but eventually reached one of the lowest validation CER values. The Transformer displayed a much longer warm-up period and remained substantially worse than the recurrent models throughout this window.

### 3.3. Transformer long-run behavior

![Transformer validation CER over all epochs](/images/emg-c147/transformer-val-cer.png)

**Fig 2. Transformer validation CER over all epochs.**

To better understand the Transformer's training behavior, I trained it well beyond the initial 40 epochs. Validation CER remained close to 100% for the first several epochs before gradually decreasing as training progressed. After approximately 50 epochs the model began to improve more rapidly, eventually reaching a best validation CER of 24.04%. Although this is a large improvement relative to its early training behavior, the final performance remained worse than the recurrent models.

### 3.4. Error breakdown analysis

Decomposing test CER into insertion, deletion, and substitution error rates:

| Model              | Test CER | Test IER | Test DER | Test SER |
| :----------------- | -------: | -------: | -------: | -------: |
| Bidirectional LSTM |    18.95 |     2.77 |     2.57 |    13.62 |
| Bidirectional GRU  |    26.09 |    12.25 |     0.48 |    13.36 |
| TDS baseline       |    24.18 |     6.27 |     2.14 |    15.78 |

Comparing the LSTM to the baseline, the largest improvement comes from a substantial reduction in insertion errors (6.27% to 2.77%). Substitution errors are also reduced moderately (15.78% to 13.62%), while deletion errors increase slightly (2.14% to 2.57%). The reduction in insertion errors accounts for the majority of the CER improvement, with additional gains from fewer substitutions.

The GRU produces a very large number of insertion errors (12.25%) while maintaining a very low deletion rate (0.48%). This indicates that the model rarely omits true characters but frequently predicts additional characters that are not present in the ground truth. Because substitution rates are similar between the GRU and LSTM (13.36% vs 13.62%), the higher CER of the GRU is primarily explained by its substantially larger insertion error rate — the GRU tends to emit characters too aggressively during decoding, producing many spurious outputs.

## 4. Discussion

These experiments suggest that recurrent sequence models are particularly well suited for single-user EMG typing. The GRU achieved the lowest validation CER but generalized poorly to the held-out test session, indicating that strong validation performance alone did not guarantee robust full-session decoding. In this setting, stable decoding behavior appeared more important than achieving the absolute lowest validation CER.

The ResNet18 + LSTM hybrid did not provide the expected benefits of stronger convolutional feature extraction. It learned much more slowly than the other models and produced worse validation and test performance despite having the largest parameter count. One possible explanation is that the ResNet18 frontend was too heavy for this single-user setting, making optimization unnecessarily difficult relative to the amount of available data. A smaller convolutional frontend may preserve the potential benefits of local feature extraction while reducing training cost and improving optimization stability.

The Transformer encoder showed a different failure mode. Its validation CER improved steadily with longer training, but full-session test evaluation could not be completed because the sinusoidal positional encoding was constructed with a maximum length of 5000, whereas the held-out test session had length 140757. The Transformer results are therefore incomplete: the observed validation performance shows that the model was learning, but its true full-session test performance could not be measured without modifying the implementation.

## 5. Limitations

Several limitations should be considered when interpreting these results.

First, all experiments were conducted on a single-user dataset. EMG signals are highly user-specific due to differences in muscle physiology, electrode placement, and typing behavior, so models that perform well for one user may not generalize to other individuals.

Second, the Transformer evaluation was incomplete due to the positional encoding limitation described above.

Third, hyperparameter tuning was limited. All models were trained using largely shared optimization settings to ensure fair comparisons and reduce experimentation time. However, some architectures — particularly the Transformer and the convolutional-recurrent hybrid — may require different learning rates, training schedules, or regularization strategies to reach their best performance.

Fourth, computational constraints limited the scope of architectural exploration. The ResNet18 + LSTM model was substantially more expensive to train than the other models and converged slowly, which restricted the number of experiments I could run.

Finally, decoding was performed using greedy CTC decoding for all models. More advanced strategies such as beam search or language model integration could potentially improve character error rates by correcting some insertion and substitution errors. These approaches were not explored in this work.

## 6. Conclusion

Among the evaluated models, the bidirectional LSTM achieved the best overall performance, reducing test CER from 24.18% to 18.95%. Although the GRU achieved the lowest validation CER, it generalized poorly due to a large increase in insertion errors. More complex architectures, including the ResNet18 + LSTM hybrid and the Transformer encoder, did not outperform the simpler recurrent model in this single-user setting. Overall, the results suggest that bidirectional LSTMs provide a strong and reliable baseline for EMG-based text decoding.

## 7. References

[1] EMG-to-QWERTY project skeleton and dataset provided for ECE-C147: Neural Networks and Deep Learning, University of California, Los Angeles, Winter 2026.

[2] ECE-C147 course project specification and assignment materials, University of California, Los Angeles, Winter 2026.

[3] A. Vaswani, N. Shazeer, N. Parmar, J. Uszkoreit, L. Jones, A. N. Gomez, Ł. Kaiser, and I. Polosukhin, "Attention Is All You Need," _Advances in Neural Information Processing Systems_, 2017.
